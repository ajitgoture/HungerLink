const FoodDonation = require('../models/FoodDonation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validatePhone } = require('../utils/validation');
const { uploadImageToCloudinary } = require('../config/cloudinary');
const { calculateDistance } = require('../utils/distance');

// @route   POST /api/food/donations
const createFoodDonation = async (req, res) => {
  try {
    const {
      foodName,
      foodType,
      quantity,
      unit,
      peopleServed,
      preparationTime,
      availableFrom,
      expiryTime,
      responseDeadline,
      pickupAddress,
      city,
      area,
      description,
      lat,
      lng,
      contactNumber,
      packaging,
      storageCondition,
      allergens,
      safetyAcknowledged,
    } = req.body;

    let parsedFoodItems = [];
    try {
      if (req.body.foodItems) {
        parsedFoodItems = JSON.parse(req.body.foodItems);
        if (!Array.isArray(parsedFoodItems)) parsedFoodItems = [];
      }
    } catch { parsedFoodItems = []; }

    // Fallbacks for backward compatibility if global fields are omitted (extract from first item)
    const firstItem = parsedFoodItems[0] || {};
    const effectiveFoodName = foodName || firstItem.foodName;
    const effectiveQuantity = quantity || firstItem.quantity;
    const effectivePeopleServed = peopleServed || firstItem.peopleServed;
    const effectivePrepTime = preparationTime || firstItem.preparationTime;
    
    // Calculate the maximum expiry time for the entire donation box
    let effectiveExpTime = expiryTime || firstItem.expiryTime;
    if (parsedFoodItems.length > 0) {
      const maxTime = Math.max(...parsedFoodItems.map(item => new Date(item.expiryTime).getTime()));
      effectiveExpTime = new Date(maxTime).toISOString();
    }

    if (!effectiveFoodName || !effectiveQuantity || !effectivePeopleServed || !effectivePrepTime || !availableFrom || !effectiveExpTime || !city || !pickupAddress || !contactNumber) {
      return res.status(400).json({ message: 'Please complete all required fields.' });
    }

    if (!safetyAcknowledged) {
      return res.status(400).json({ message: 'You must acknowledge the food safety guarantees.' });
    }

    if (!validatePhone(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must contain exactly 10 numerical digits.' });
    }

    const prepDate = new Date(effectivePrepTime);
    const availDate = new Date(availableFrom);
    const expDate = new Date(effectiveExpTime);

    if (expDate <= prepDate || expDate <= availDate) {
      return res.status(400).json({ message: 'Expiry time must be later than preparation and availability times.' });
    }

    let respDeadlineDate;
    if (responseDeadline) {
      respDeadlineDate = new Date(responseDeadline);
    } else {
      respDeadlineDate = new Date(expDate.getTime() - 30 * 60 * 1000); // Default 30 mins before expiry
      if (respDeadlineDate < availDate) {
        respDeadlineDate = expDate;
      }
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer, foodName);
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const { validateCoordinates } = require('../utils/locationValidator');
    const hasLatitude = lat !== undefined && lat !== null && String(lat).trim() !== '';
    const hasLongitude = lng !== undefined && lng !== null && String(lng).trim() !== '';
    if (hasLatitude !== hasLongitude) {
      return res.status(400).json({ message: 'Provide both latitude and longitude, or neither.' });
    }
    const latitude = hasLatitude ? Number(lat) : null;
    const longitude = hasLongitude ? Number(lng) : null;
    const hasCoordinates = hasLatitude && validateCoordinates(latitude, longitude);
    if (hasLatitude && !hasCoordinates) {
      return res.status(400).json({ message: 'Valid GPS coordinates are required. Known fake, default, or invalid locations are not permitted.' });
    }

    const donation = await FoodDonation.create({
      donor: req.user._id,
      foodName: effectiveFoodName,
      foodType: foodType || firstItem.foodType || 'Vegetarian',
      quantity: Number(effectiveQuantity),
      unit: unit || firstItem.unit || 'plates',
      peopleServed: Number(effectivePeopleServed),
      preparationTime: prepDate,
      availableFrom: availDate,
      expiryTime: expDate,
      responseDeadline: respDeadlineDate,
      approximateLocation: {
        city,
        area: area || city,
        lat: latitude,
        lng: longitude,
      },
      preciseLocation: {
        address: pickupAddress,
        lat: latitude,
        lng: longitude,
      },
      ...(hasCoordinates && { location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      } }),
      city,
      description: description || firstItem.description || '',
      foodItems: parsedFoodItems,
      imageUrl,
      contactNumber,
      packaging: packaging || 'Other',
      storageCondition: storageCondition || 'Room Temperature',
      allergens: allergens || [],
      safetyAcknowledged: safetyAcknowledged === true || safetyAcknowledged === 'true',
      status: 'AVAILABLE',
    });

    const populatedDonation = await FoodDonation.findById(donation._id).populate('donor', 'name email phone city');

    // Create User-Friendly DB Notification for Donor
    const donorNotif = await Notification.create({
      recipient: req.user._id,
      title: 'Donation Posted 🍲',
      message: `Your food donation "${effectiveFoodName}" has been posted successfully.`,
      type: 'FOOD_DONATION_POSTED',
      relatedDonation: donation._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('NEW_FOOD_DONATION', populatedDonation);
      io.to(`user_${req.user._id.toString()}`).emit('notification:new', donorNotif);
    }

    res.status(201).json(populatedDonation);
  } catch (error) {
    console.error('Error creating food donation:', error.message);
    res.status(500).json({ message: error.message || 'Server error creating food donation' });
  }
};

// @route   GET /api/food/donations/available
const getAvailableDonations = async (req, res) => {
  try {
    const { foodType, city, search, userLat, userLng } = req.query;
    const now = new Date();

    const filter = {
      status: { $in: ['AVAILABLE', 'REQUESTED'] },
      expiryTime: { $gt: now },
    };

    if (foodType && foodType !== 'ALL') filter.foodType = foodType;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { foodName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const donations = await FoodDonation.find(filter)
      .populate('donor', 'name city')
      .sort({ createdAt: -1 });

    const sanitized = donations.map((d) => {
      const doc = d.toObject();
      delete doc.preciseLocation;
      if (userLat && userLng) {
        doc.distanceKm = calculateDistance(userLat, userLng, doc.approximateLocation.lat, doc.approximateLocation.lng);
      }
      return doc;
    });

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching available donations:', error);
    res.status(500).json({ message: 'Error fetching available food donations' });
  }
};

// @route   GET /api/food/donations/my-donations
const getMyDonations = async (req, res) => {
  try {
    const donations = await FoodDonation.find({ donor: req.user._id })
      .populate('acceptedReceiver', 'name phone email city')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching my donations' });
  }
};

// @route   GET /api/food/donations/donor/:donorId
const getDonationsByDonor = async (req, res) => {
  try {
    const donations = await FoodDonation.find({ donor: req.params.donorId })
      .populate('donor', 'name city')
      .sort({ createdAt: -1 });

    const sanitized = donations.map((d) => {
      const doc = d.toObject();
      // Hide private details from non-involved receivers
      delete doc.preciseLocation;
      delete doc.contactNumber;
      if (doc.donor) {
        delete doc.donor.phone;
        delete doc.donor.email;
        delete doc.donor.address;
      }
      return doc;
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor donations' });
  }
};

// @route   GET /api/food/donations/:id
const getDonationById = async (req, res) => {
  try {
    const donation = await FoodDonation.findById(req.params.id)
      .populate('donor', 'name phone email city address')
      .populate('acceptedReceiver', 'name phone email city');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const doc = donation.toObject();
    const isDonor = req.user && donation.donor._id.toString() === req.user._id.toString();
    const isAcceptedReceiver = req.user && donation.acceptedReceiver && donation.acceptedReceiver._id.toString() === req.user._id.toString();

    if (!isDonor && !isAcceptedReceiver) {
      delete doc.preciseLocation;
      delete doc.contactNumber;
      if (doc.donor) {
        delete doc.donor.phone;
        delete doc.donor.address;
      }
    }

    res.json(doc);
  } catch (error) {
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid donation ID format' });
    }
    res.status(500).json({ message: 'Error fetching donation details' });
  }
};

// @route   PATCH /api/food/donations/:id/status
const updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can update donation status' });
    }

    donation.status = status;
    await donation.save();

    const io = req.app.get('socketio');
    if (io && donation.acceptedReceiver) {
      io.to(`user_${donation.acceptedReceiver.toString()}`).emit('DONATION_UPDATED', {
        donationId: donation._id,
        status,
        message: `Food donation status updated: ${status.replace(/_/g, ' ')}`,
      });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
};

module.exports = {
  createFoodDonation,
  getAvailableDonations,
  getMyDonations,
  getDonationById,
  updateDonationStatus,
  getDonationsByDonor,
};

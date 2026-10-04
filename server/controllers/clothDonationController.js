const ClothDonation = require('../models/ClothDonation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validatePhone } = require('../utils/validation');
const { uploadImageToCloudinary } = require('../config/cloudinary');
const { calculateDistance } = require('../utils/distance');

// @route   POST /api/cloth/donations
const createClothDonation = async (req, res) => {
  try {
    const {
      items, // The new items array (stringified)
      clothingCategory,
      clothingType,
      customClothingType,
      gender,
      ageGroup,
      quantity,
      size,
      condition,
      season,
      description,
      availableFrom,
      pickupDate,
      pickupTimeWindow,
      availableUntil,
      
      pickupAddress,
      city,
      area,
      lat,
      lng,
      contactNumber,
      qualityAcknowledged,
    } = req.body;

    let parsedItems = [];
    if (items) {
      try {
        parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid items format' });
      }
    } else {
      parsedItems = [{
        recipientCategory: clothingCategory || 'Unisex',
        type: clothingType || 'Other',
        size: size || 'Free Size',
        quantity: Number(quantity) || 1,
        condition: condition || 'Good',
        season: season || 'All Season'
      }];
    }

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ message: 'At least one clothing item is required.' });
    }

    if (!availableFrom || !city || !pickupAddress || !contactNumber) {
      return res.status(400).json({ message: 'Please complete all required fields.' });
    }

    if (!qualityAcknowledged) {
      return res.status(400).json({ message: 'You must acknowledge the clothing quality guarantees.' });
    }

    if (!validatePhone(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must contain exactly 10 numerical digits.' });
    }

    const availDate = new Date(availableFrom);
    let untilDate = availableUntil ? new Date(availableUntil) : null;
    

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        // Just use the first item's type or 'Mixed' for cloudinary folder/tag
        const uploadTag = parsedItems[0]?.type || clothingType || 'Mixed';
        const url = await uploadImageToCloudinary(file.buffer, uploadTag);
        imageUrls.push(url);
      }
    } else if (req.body.imageUrl) {
      imageUrls.push(req.body.imageUrl);
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
    
    // Calculate total quantity for legacy field fallback
    const totalQuantity = parsedItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    // Use first item for legacy scalar fields
    const firstItem = parsedItems[0];

    const donation = await ClothDonation.create({
      donor: req.user._id,
      items: parsedItems,
      // Legacy fields
      clothingCategory: firstItem.recipientCategory || 'Unisex',
      clothingType: firstItem.type || 'Other',
      customClothingType: customClothingType || '',
      gender: gender || 'Unisex',
      ageGroup: ageGroup || 'Adults',
      quantity: totalQuantity,
      size: firstItem.size || 'Free Size',
      condition: firstItem.condition || 'Good',
      season: firstItem.season || 'All Season',
      
      description: description || '',
      imageUrls,
      availableFrom: availDate,
      pickupDate: pickupDate || availDate.toISOString().slice(0, 10),
      pickupTimeWindow: pickupTimeWindow || 'Flexible',
      availableUntil: untilDate,
      
      
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
      contactNumber,
      qualityAcknowledged: qualityAcknowledged === true || qualityAcknowledged === 'true',
      status: 'AVAILABLE',
    });

    const populatedDonation = await ClothDonation.findById(donation._id).populate('donor', 'name email phone city');

    // Create User-Friendly DB Notification for Donor
    const donorNotif = await Notification.create({
      recipient: req.user._id,
      title: 'Donation Posted',
      message: `Your clothes donation has been posted successfully.`,
      type: 'CLOTH_DONATION_POSTED',
      relatedDonation: donation._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('cloth:donation-created', populatedDonation);
      io.to(`user_${req.user._id.toString()}`).emit('notification:new', donorNotif);
    }

    res.status(201).json(populatedDonation);
  } catch (error) {
    console.error('Error creating clothes donation:', error.message);
    res.status(500).json({ message: error.message || 'Server error creating clothes donation' });
  }
};

const mapLegacyToItems = (doc) => {
  if (doc.items && doc.items.length > 0) return doc;
  doc.items = [{
     recipientCategory: doc.clothingCategory || 'Unisex',
     type: doc.clothingType || 'Other',
     size: doc.size || 'Other',
     quantity: doc.quantity || 1,
     condition: doc.condition || 'Good',
     season: doc.season || 'All Season'
  }];
  return doc;
};

// @route   GET /api/cloth/donations/available
const getAvailableClothDonations = async (req, res) => {
  try {
    const { category, type, size, season, city, search, userLat, userLng } = req.query;
    const now = new Date();

    const filter = {
      status: { $in: ['AVAILABLE', 'REQUESTED'] },
      
    };

    
    const andConditions = [];
    if (category && category !== 'ALL') andConditions.push({ $or: [{ clothingCategory: category }, { 'items.recipientCategory': category }] });
    if (type && type !== 'ALL') andConditions.push({ $or: [{ clothingType: type }, { 'items.type': type }] });
    if (size && size !== 'ALL') andConditions.push({ $or: [{ size: size }, { 'items.size': size }] });
    if (season && season !== 'ALL') andConditions.push({ $or: [{ season: season }, { 'items.season': season }] });
    
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (search) {
      andConditions.push({
        $or: [
          { clothingType: { $regex: search, $options: 'i' } },
          { 'items.type': { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      });
    }
    
    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }


    const donations = await ClothDonation.find(filter)
      .populate('donor', 'name city')
      .sort({ createdAt: -1 });

    const sanitized = donations.map((d) => {
      let doc = mapLegacyToItems(d.toObject());
      delete doc.preciseLocation;
      if (userLat && userLng) {
        doc.distanceKm = calculateDistance(userLat, userLng, doc.approximateLocation.lat, doc.approximateLocation.lng);
      }
      return doc;
    });

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching available clothes:', error);
    res.status(500).json({ message: 'Error fetching available clothes' });
  }
};

// @route   GET /api/cloth/donations/my-donations
const getMyClothDonations = async (req, res) => {
  try {
    const donations = await ClothDonation.find({ donor: req.user._id })
      .populate('acceptedReceiver', 'name phone email city')
      .sort({ createdAt: -1 });
    res.json(donations.map(d => mapLegacyToItems(d.toObject())));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching my clothes donations' });
  }
};

// @route   GET /api/cloth/donations/:id
const getClothDonationById = async (req, res) => {
  try {
    const donation = await ClothDonation.findById(req.params.id)
      .populate('donor', 'name phone email city address')
      .populate('acceptedReceiver', 'name phone email city');

    if (!donation) {
      return res.status(404).json({ message: 'Clothes donation not found' });
    }

    let doc = mapLegacyToItems(donation.toObject());
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
    res.status(500).json({ message: 'Error fetching clothes donation details' });
  }
};

// @route   PATCH /api/cloth/donations/:id/status
const updateClothDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await ClothDonation.findById(req.params.id);

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
      io.to(`user_${donation.acceptedReceiver.toString()}`).emit('cloth:donation-updated', {
        donationId: donation._id,
        status,
        message: `Clothes status updated: ${status.replace(/_/g, ' ')}`,
      });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
};

module.exports = {
  createClothDonation,
  getAvailableClothDonations,
  getMyClothDonations,
  getClothDonationById,
  updateClothDonationStatus,
};

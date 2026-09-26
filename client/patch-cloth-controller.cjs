const fs = require('fs');

function patchController() {
  const file = 'd:/Smart_Unified_Donation_System/server/controllers/clothDonationController.js';
  let c = fs.readFileSync(file, 'utf-8');

  // Replace createClothDonation body
  c = c.replace(/const createClothDonation = async \(req, res\) => \{[\s\S]*?\/\/ @route   GET \/api\/cloth\/donations\/available/m, 
`const createClothDonation = async (req, res) => {
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
      expiryTime,
      responseDeadline,
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
    let expDate = untilDate || (expiryTime ? new Date(expiryTime) : new Date(availDate.getTime() + 30 * 24 * 60 * 60 * 1000));

    if (expDate <= availDate) {
      expDate = new Date(availDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    let respDeadlineDate = responseDeadline
      ? new Date(responseDeadline)
      : new Date(expDate.getTime() - 24 * 60 * 60 * 1000);

    if (respDeadlineDate < availDate) {
      respDeadlineDate = expDate;
    }

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

    const latitude = parseFloat(lat) || 40.7128;
    const longitude = parseFloat(lng) || -74.006;
    
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
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
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
      message: \`Your clothes donation has been posted successfully.\`,
      type: 'CLOTH_DONATION_POSTED',
      relatedDonation: donation._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('cloth:donation-created', populatedDonation);
      io.to(\`user_\${req.user._id.toString()}\`).emit('notification:new', donorNotif);
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

// @route   GET /api/cloth/donations/available`);

  // Replace getAvailableClothDonations filtering logic
  c = c.replace(/if \(category && category !== 'ALL'\) filter\.clothingCategory = category;[\s\S]*?if \(search\) \{[\s\S]*?\];\s*\}/m,
`
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
`);

  // Add mapLegacyToItems in all getters
  c = c.replace(/const sanitized = donations\.map\(\(d\) => \{/g, 
`const sanitized = donations.map((d) => {
      let doc = mapLegacyToItems(d.toObject());`);
      
  c = c.replace(/const doc = donation\.toObject\(\);/, 
    'let doc = mapLegacyToItems(donation.toObject());');
    
  c = c.replace(/res\.json\(donations\);/g, 
    'res.json(donations.map(d => mapLegacyToItems(d.toObject())));');

  fs.writeFileSync(file, c);
  console.log('Patched ClothDonation controller');
}

patchController();

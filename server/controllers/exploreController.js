const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');

// @route   GET /api/explore
const getExploreDonations = async (req, res) => {
  try {
    const {
      type, // 'food', 'cloth', or 'all'
      search,
      userLat,
      userLng,
      maxDistance, // removed default 50
      foodType,
      clothingCategory,
      size,
      condition,
      season,
      sort = 'nearest' // 'nearest', 'newest', 'expires_soon', 'urgency'
    } = req.query;

    const lat = parseFloat(userLat);
    const lng = parseFloat(userLng);
    
    const hasLocation = !isNaN(lat) && !isNaN(lng);

    // Build common filter for food
    const foodFilter = { 
      status: 'AVAILABLE',
      expiryTime: { $gt: new Date() },
      quantity: { $gt: 0 }
    };
    if (search) foodFilter.foodName = { $regex: search, $options: 'i' };
    if (foodType && foodType !== 'ALL') foodFilter.foodType = foodType;

    // Build common filter for cloth
    const clothFilter = { status: 'AVAILABLE' };
    if (search) clothFilter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { clothingType: { $regex: search, $options: 'i' } }
    ];
    if (clothingCategory && clothingCategory !== 'ALL') clothFilter.clothingCategory = clothingCategory;
    if (size && size !== 'ALL') clothFilter.size = size;
    if (condition && condition !== 'ALL') clothFilter.condition = condition;
    if (season && season !== 'ALL') clothFilter.season = season;

    const fetchFood = async () => {
      let pipeline = [];
      if (hasLocation) {
        const geoNearOpts = {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: foodFilter
        };
        if (maxDistance) {
          geoNearOpts.maxDistance = parseFloat(maxDistance) * 1000;
        }
        pipeline.push({ $geoNear: geoNearOpts });
      } else {
        pipeline.push({ $match: foodFilter });
      }

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'donor',
          foreignField: '_id',
          as: 'donor'
        }
      });
      pipeline.push({ $unwind: '$donor' });
      pipeline.push({
        $project: {
          'donor.password': 0,
          'donor.tokens': 0,
          'preciseLocation': 0,
          'contactNumber': 0
        }
      });

      const results = await FoodDonation.aggregate(pipeline);
      return results.map(d => ({ ...d, moduleType: 'food' }));
    };

    const fetchCloth = async () => {
      let pipeline = [];
      if (hasLocation) {
        const geoNearOpts = {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: clothFilter
        };
        if (maxDistance) {
          geoNearOpts.maxDistance = parseFloat(maxDistance) * 1000;
        }
        pipeline.push({ $geoNear: geoNearOpts });
      } else {
        pipeline.push({ $match: clothFilter });
      }

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'donor',
          foreignField: '_id',
          as: 'donor'
        }
      });
      pipeline.push({ $unwind: '$donor' });
      pipeline.push({
        $project: {
          'donor.password': 0,
          'donor.tokens': 0,
          'preciseLocation': 0,
          'contactNumber': 0
        }
      });

      const results = await ClothDonation.aggregate(pipeline);
      return results.map(d => ({ ...d, moduleType: 'cloth' }));
    };

    let allDonations = [];

    if (!type || type === 'all' || type === 'food') {
      const foodRes = await fetchFood();
      allDonations = [...allDonations, ...foodRes];
    }

    if (!type || type === 'all' || type === 'cloth') {
      const clothRes = await fetchCloth();
      allDonations = [...allDonations, ...clothRes];
    }

    // Convert distance to km if calculated
    if (hasLocation) {
      allDonations.forEach(d => {
        if (d.distance) {
          d.distanceKm = d.distance / 1000;
        }
      });
    }

    // Sorting in JS since we merged two collections
    if (sort === 'nearest' && hasLocation) {
      allDonations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sort === 'expires_soon') {
      allDonations.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
    } else if (sort === 'urgency') {
      // Calculate urgency score
      const now = new Date();
      allDonations.forEach(d => {
        const hrs = (new Date(d.expiryTime) - now) / (1000 * 60 * 60);
        d.urgencyScore = hrs; 
      });
      allDonations.sort((a, b) => a.urgencyScore - b.urgencyScore);
    } else {
      // Default newest
      allDonations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(allDonations);
  } catch (error) {
    console.error('Error exploring donations:', error);
    res.status(500).json({ message: 'Server error exploring donations' });
  }
};

module.exports = {
  getExploreDonations
};

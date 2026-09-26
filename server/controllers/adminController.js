const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');
const FoodRequest = require('../models/FoodRequest');
const ClothRequest = require('../models/ClothRequest');
const User = require('../models/User');
const Review = require('../models/Review');
const Report = require('../models/Report');

exports.getSystemStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeFood,
      activeCloth,
      pendingFoodReqs,
      pendingClothReqs,
      completedFoodToday,
      completedClothToday,
      expiredFoodToday,
      expiredClothToday,
      activeFoodTransfers,
      activeClothTransfers
    ] = await Promise.all([
      User.countDocuments(),
      FoodDonation.countDocuments({ status: { $in: ['AVAILABLE'] } }),
      ClothDonation.countDocuments({ status: { $in: ['AVAILABLE'] } }),
      FoodRequest.countDocuments({ status: 'PENDING' }),
      ClothRequest.countDocuments({ status: 'PENDING' }),
      FoodDonation.countDocuments({ status: 'COMPLETED', updatedAt: { $gte: today } }),
      ClothDonation.countDocuments({ status: 'COMPLETED', updatedAt: { $gte: today } }),
      FoodDonation.countDocuments({ status: 'EXPIRED', updatedAt: { $gte: today } }),
      ClothDonation.countDocuments({ status: 'EXPIRED', updatedAt: { $gte: today } }),
      FoodDonation.countDocuments({ status: { $in: ['ACCEPTED', 'TRANSFER_METHOD_SELECTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'HANDOVER_PENDING'] } }),
      ClothDonation.countDocuments({ status: { $in: ['ACCEPTED', 'TRANSFER_METHOD_SELECTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'HANDOVER_PENDING'] } })
    ]);

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const [urgentFood, urgentCloth] = await Promise.all([
      FoodDonation.countDocuments({ status: { $in: ['AVAILABLE', 'REQUESTED'] }, expiryTime: { $lt: twoHoursFromNow, $gt: now } }),
      ClothDonation.countDocuments({ status: { $in: ['AVAILABLE', 'REQUESTED'] }, expiryTime: { $lt: twoHoursFromNow, $gt: now } })
    ]);

    res.json({
      overview: {
        totalUsers,
        activeDonations: activeFood + activeCloth,
        pendingRequests: pendingFoodReqs + pendingClothReqs,
        activeTransfers: activeFoodTransfers + activeClothTransfers,
        urgentDonations: urgentFood + urgentCloth,
        completedToday: completedFoodToday + completedClothToday,
        expiredToday: expiredFoodToday + expiredClothToday
      },
      distribution: {
        food: activeFood + completedFoodToday + expiredFoodToday + activeFoodTransfers,
        cloth: activeCloth + completedClothToday + expiredClothToday + activeClothTransfers
      }
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error);
    res.status(500).json({ message: 'Error fetching system stats.' });
  }
};

exports.getLiveOperations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activeDonations = await FoodDonation.find({
      status: { $in: ['ACCEPTED', 'TRANSFER_METHOD_SELECTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'HANDOVER_PENDING'] }
    })
    .select('foodName status approximateLocation updatedAt donor acceptedReceiver')
    .populate('donor', 'name role')
    .populate('acceptedReceiver', 'name role')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

    res.json({
      operations: activeDonations.map(d => ({
        id: d._id,
        item: d.foodName,
        type: 'Food',
        status: d.status,
        location: d.approximateLocation?.city,
        updatedAt: d.updatedAt,
        donorName: d.donor?.name,
        receiverName: d.acceptedReceiver?.name
      }))
    });
  } catch (error) {
    console.error('[Live Operations Error]:', error);
    res.status(500).json({ message: 'Error fetching live operations.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('[Admin Users Error]:', error);
    res.status(500).json({ message: 'Error fetching users.' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(reports);
  } catch (error) {
    console.error('[Admin Reports Error]:', error);
    res.status(500).json({ message: 'Error fetching reports.' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Donations per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [foodDaily, clothDaily] = await Promise.all([
      FoodDonation.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
        }},
        { $sort: { '_id': 1 } }
      ]),
      ClothDonation.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
        }},
        { $sort: { '_id': 1 } }
      ])
    ]);

    // 2. Food vs Clothes
    const [totalFood, totalCloth] = await Promise.all([
      FoodDonation.countDocuments(),
      ClothDonation.countDocuments()
    ]);

    // 3. Completed vs Expired
    const [completedFood, expiredFood, completedCloth, expiredCloth] = await Promise.all([
      FoodDonation.countDocuments({ status: 'COMPLETED' }),
      FoodDonation.countDocuments({ status: 'EXPIRED' }),
      ClothDonation.countDocuments({ status: 'COMPLETED' }),
      ClothDonation.countDocuments({ status: 'EXPIRED' })
    ]);

    const totalCompleted = completedFood + completedCloth;
    const totalExpired = expiredFood + expiredCloth;

    // 5. Supply vs Demand Geographic Aggregation (High-level)
    const foodSupplyGeo = await FoodDonation.aggregate([
      { $match: { status: { $in: ['AVAILABLE', 'REQUESTED'] } } },
      { $group: { _id: '$approximateLocation.city', supply: { $sum: 1 } } }
    ]);
    
    const foodDemandGeo = await FoodRequest.aggregate([
      { $match: { status: 'PENDING' } },
      { $lookup: { from: 'fooddonations', localField: 'donation', foreignField: '_id', as: 'donationDoc' } },
      { $unwind: '$donationDoc' },
      { $group: { _id: '$donationDoc.approximateLocation.city', demand: { $sum: 1 } } }
    ]);

    const geoMap = {};
    foodSupplyGeo.forEach(item => {
      if (item._id) geoMap[item._id] = { supply: item.supply, demand: 0 };
    });
    foodDemandGeo.forEach(item => {
      if (item._id) {
        if (!geoMap[item._id]) geoMap[item._id] = { supply: 0, demand: 0 };
        geoMap[item._id].demand = item.demand;
      }
    });

    const geoInsights = Object.keys(geoMap).map(city => {
      const { supply, demand } = geoMap[city];
      let status = 'BALANCED';
      if (demand > supply * 1.5) status = 'HIGH DEMAND';
      else if (supply > demand * 1.5) status = 'HIGH SUPPLY';
      return { city, supply, demand, status };
    }).sort((a, b) => (b.supply + b.demand) - (a.supply + a.demand)).slice(0, 10);

    res.json({
      dailyTrend: {
        food: foodDaily,
        cloth: clothDaily
      },
      distribution: {
        food: totalFood,
        cloth: totalCloth
      },
      outcomes: {
        completed: totalCompleted,
        expired: totalExpired,
        cancellationRate: totalCompleted > 0 ? Math.round(((totalFood + totalCloth - totalCompleted - totalExpired) / (totalFood + totalCloth)) * 100) : 0
      },
      geoInsights
    });
  } catch (error) {
    console.error('[Admin Analytics Error]:', error);
    res.status(500).json({ message: 'Error fetching analytics.' });
  }
};

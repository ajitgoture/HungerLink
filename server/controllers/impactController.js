const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');
const FoodRequest = require('../models/FoodRequest');
const ClothRequest = require('../models/ClothRequest');

exports.getPersonalImpact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe } = req.query; // 'today', 'week', 'month', 'all'

    let dateFilter = {};
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      if (timeframe === 'today') startDate = new Date(now.setHours(0,0,0,0));
      else if (timeframe === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
      else if (timeframe === 'month') startDate = new Date(now.setMonth(now.getMonth() - 1));
      
      if (startDate) {
        dateFilter = { createdAt: { $gte: startDate } };
      }
    }

    const isDonor = req.user.role.includes('Donor');
    const isReceiver = req.user.role.includes('Receiver');

    let stats = {
      mealsShared: 0,
      clothesDonated: 0,
      successfulTransfers: 0,
      peopleHelped: 0,
      completionRate: 0,
      itemsReceived: 0,
      successfulRequests: 0
    };

    if (isDonor) {
      const foodDonations = await FoodDonation.find({ donor: userId, ...dateFilter });
      const clothDonations = await ClothDonation.find({ donor: userId, ...dateFilter });

      const completedFood = foodDonations.filter(d => d.status === 'COMPLETED');
      const completedCloth = clothDonations.filter(d => d.status === 'COMPLETED');

      stats.mealsShared = completedFood.reduce((sum, d) => sum + (d.quantity || 0), 0);
      stats.peopleHelped = completedFood.reduce((sum, d) => sum + (d.peopleServed || 0), 0);
      stats.clothesDonated = completedCloth.reduce((sum, d) => sum + (d.quantity || 0), 0);
      stats.successfulTransfers = completedFood.length + completedCloth.length;

      const totalDonations = foodDonations.length + clothDonations.length;
      stats.completionRate = totalDonations > 0 ? Math.round((stats.successfulTransfers / totalDonations) * 100) : 0;
    }

    if (isReceiver) {
      const foodReqs = await FoodRequest.find({ requester: userId, status: 'COMPLETED', ...dateFilter }).populate('donation');
      const clothReqs = await ClothRequest.find({ requester: userId, status: 'COMPLETED', ...dateFilter }).populate('donation');

      stats.successfulRequests = foodReqs.length + clothReqs.length;
      stats.itemsReceived = 
        foodReqs.reduce((sum, r) => sum + (r.donation?.quantity || 0), 0) + 
        clothReqs.reduce((sum, r) => sum + (r.donation?.quantity || 0), 0);
    }

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving personal impact.' });
  }
};

exports.getCommunityImpact = async (req, res) => {
  try {
    const { timeframe } = req.query;

    let dateFilter = {};
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      if (timeframe === 'today') startDate = new Date(now.setHours(0,0,0,0));
      else if (timeframe === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
      else if (timeframe === 'month') startDate = new Date(now.setMonth(now.getMonth() - 1));
      
      if (startDate) {
        dateFilter = { createdAt: { $gte: startDate } };
      }
    }

    const foodDonations = await FoodDonation.find({ status: 'COMPLETED', ...dateFilter });
    const clothDonations = await ClothDonation.find({ status: 'COMPLETED', ...dateFilter });

    const totalFoodMeals = foodDonations.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const estimatedPeopleHelped = foodDonations.reduce((sum, d) => sum + (d.peopleServed || 0), 0);
    const totalClothes = clothDonations.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const completedTransfers = foodDonations.length + clothDonations.length;

    res.json({
      totalFoodMeals,
      totalClothes,
      completedTransfers,
      estimatedPeopleHelped
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving community impact.' });
  }
};

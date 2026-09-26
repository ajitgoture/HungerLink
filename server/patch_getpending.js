const fs = require('fs');
let s = fs.readFileSync('controllers/reviewController.js', 'utf8');

const newGetPendingReviews = `const getPendingReviews = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const FoodRequest = require('../models/FoodRequest');
    const ClothRequest = require('../models/ClothRequest');
    const Review = require('../models/Review');

    const completedFoodReqs = await FoodRequest.find({
      status: 'COMPLETED',
      $or: [{ donor: userId }, { receiver: userId }]
    }).populate('donor', 'name').populate('receiver', 'name').populate('donation').lean();

    const completedClothReqs = await ClothRequest.find({
      status: 'COMPLETED',
      $or: [{ donor: userId }, { receiver: userId }]
    }).populate('donor', 'name').populate('receiver', 'name').populate('donation').lean();

    const allRequests = [
      ...completedFoodReqs.map(r => ({ ...r, moduleType: 'food' })),
      ...completedClothReqs.map(r => ({ ...r, moduleType: 'cloth' }))
    ];

    const pendingReviews = [];
    for (const reqDoc of allRequests) {
      if (!reqDoc.donation) continue;

      const donorStrId = reqDoc.donor._id ? reqDoc.donor._id.toString() : reqDoc.donor.toString();
      const receiverStrId = reqDoc.receiver._id ? reqDoc.receiver._id.toString() : reqDoc.receiver.toString();
      
      const revieweeId = userId === donorStrId ? receiverStrId : donorStrId;

      const reviewExists = await Review.exists({ 
        donationId: reqDoc.donation._id, 
        reviewerId: userId,
        revieweeId: revieweeId
      });
      
      if (!reviewExists) {
        pendingReviews.push({
          ...reqDoc.donation,
          moduleType: reqDoc.moduleType,
          requestId: reqDoc._id,
          donor: reqDoc.donor,
          acceptedReceiver: reqDoc.receiver
        });
      }
    }

    res.json(pendingReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`;

// replace old getPendingReviews
const oldStart = s.indexOf('const getPendingReviews = async');
const oldEndStr = 'module.exports = {';
const oldEnd = s.indexOf(oldEndStr);
s = s.substring(0, oldStart) + newGetPendingReviews + '\n\n' + s.substring(oldEnd);

fs.writeFileSync('controllers/reviewController.js', s);
console.log('Fixed getPendingReviews');

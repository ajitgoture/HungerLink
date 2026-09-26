const Review = require('../models/Review');
const Report = require('../models/Report');
const User = require('../models/User');
const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');

const submitReview = async (req, res) => {
  try {
    const { donationId, moduleType, rating, categories, comment, revieweeId: providedRevieweeId } = req.body;
    const reviewerId = req.user._id.toString();

    if (rating === undefined || rating === null || rating < 1 || rating > 5) {
      return res.status(422).json({ message: 'Please provide a valid rating between 1 and 5' });
    }

    // 1. Verify donation exists and is completed
    const Model = moduleType === 'food' ? FoodDonation : ClothDonation;
    const donation = await Model.findById(donationId);
    
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const reqCompleted = await RequestModel.exists({ donation: donationId, status: 'COMPLETED' });
    
    if (donation.status !== 'COMPLETED' && !reqCompleted) {
      return res.status(400).json({ message: 'Can only review completed transfers' });
    }

    // 2. Determine role and reviewee
    let role;
    let finalRevieweeId = providedRevieweeId;
    const donorId = donation.donor._id?.toString() || donation.donor.toString();


    if (reviewerId === donorId) {
      role = 'DONOR';
      // If donor didn't provide reviewee, try to fallback
      if (!finalRevieweeId) {
        const reqDoc = await RequestModel.findOne({ donation: donationId, donor: reviewerId, status: 'COMPLETED' }).sort({ updatedAt: -1 });
        if (reqDoc) finalRevieweeId = reqDoc.receiver.toString();
      }
      
      // Verify receiver was part of this donation
      const validReq = await RequestModel.exists({ donation: donationId, donor: reviewerId, receiver: finalRevieweeId, status: 'COMPLETED' });
      if (!validReq && donation.acceptedReceiver?.toString() !== finalRevieweeId?.toString()) {
        return res.status(403).json({ message: 'You were not a participant in this transfer with the specified user' });
      }
    } else {
      role = 'RECEIVER';
      finalRevieweeId = donorId; // The receiver ALWAYS rates the donor

      const validReq = await RequestModel.exists({ donation: donationId, donor: finalRevieweeId, receiver: reviewerId, status: 'COMPLETED' });
      if (!validReq && donation.acceptedReceiver?.toString() !== reviewerId) {
        return res.status(403).json({ message: 'You were not a participant in this transfer' });
      }
    }
    
    const revieweeId = finalRevieweeId;
    if (!revieweeId) return res.status(400).json({ message: 'Could not determine reviewee' });

    // 3. Create review (Mongoose unique index prevents duplicates)
    await Review.create({
      donationId,
      moduleType,
      reviewerId,
      revieweeId,
      role,
      rating,
      categories,
      comment
    });

    // 4. Recalculate reviewee's stats
    const allReviews = await Review.find({ revieweeId });
    const totalReviews = allReviews.length;
    const averageRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews;

    // Simple reliability score algorithm:
    // (Average Rating * 20) + (Completion Rate * 0.5) - (Cancellation Rate)
    // We would need to calculate real completion rates but for now we just update averageRating and totalReviews.
    const user = await User.findById(revieweeId);
    if (user) {
      user.stats.averageRating = Number(averageRating.toFixed(1));
      user.stats.totalReviews = totalReviews;
      
      // (completedTransfers is now correctly incremented exactly once during completeTransfer) 

      await user.save();
    }

    const io = req.app.get('socketio');
    if (io) {
      const Notification = require('../models/Notification');
      const notif = await Notification.create({
        recipient: revieweeId,
        type: 'RATING_RECEIVED',
        title: 'New Rating Received',
        message: `You received a ${rating}-star rating from a ${role.toLowerCase()}.`,
        relatedDonation: donationId
      });
      io.to(`user_${revieweeId}`).emit('notification:new', notif);
    }

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this transfer' });
    }
    if (error.name === 'ValidationError') {
      return res.status(422).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const checkReviewStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const reviewerId = req.user._id.toString();

    const review = await Review.findOne({ donationId, reviewerId });
    res.json({ hasReviewed: !!review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitReport = async (req, res) => {
  try {
    const { reportedUserId, donationId, moduleType, reason, description } = req.body;
    const reporterId = req.user._id.toString();

    await Report.create({
      reporterId,
      reportedUserId,
      donationId,
      moduleType,
      reason,
      description
    });

    res.json({ message: 'Report submitted successfully. Thank you for keeping the community safe.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingReviews = async (req, res) => {
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
};

module.exports = {
  submitReview,
  checkReviewStatus,
  submitReport,
  getPendingReviews
};

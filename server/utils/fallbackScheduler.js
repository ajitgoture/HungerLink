const FoodDonation = require('../models/FoodDonation');
const FoodRequest = require('../models/FoodRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { processUrgencyAlerts, processAutomaticExpiry } = require('./urgencyEngine');

/**
 * Concurrency-Safe Atomic Acceptance Helper
 */
const attemptAtomicAcceptance = async (donationId, receiverId, isFallback = false, io = null) => {
  const now = new Date();

  // Atomic Condition Update on FoodDonation
  const updatedDonation = await FoodDonation.findOneAndUpdate(
    {
      _id: donationId,
      status: { $in: ['AVAILABLE', 'REQUESTED'] },
      expiryTime: { $gt: now },
    },
    {
      $set: {
        status: 'ACCEPTED',
        acceptedReceiver: receiverId,
      },
    },
    { new: true }
  ).populate('donor', 'name email phone city address');

  if (!updatedDonation) {
    return null;
  }

  // Update winning request to ACCEPTED
  const acceptedRequest = await FoodRequest.findOneAndUpdate(
    { donation: donationId, receiver: receiverId, status: 'PENDING' },
    { $set: { status: 'ACCEPTED', acceptedAt: now } },
    { new: true }
  ).populate('receiver', 'name email phone city');

  if (!acceptedRequest) {
    await FoodDonation.findByIdAndUpdate(donationId, { status: 'AVAILABLE', acceptedReceiver: null });
    return null;
  }

  // Update all remaining pending requests to NOT_SELECTED
  const otherPendingRequests = await FoodRequest.find({
    donation: donationId,
    _id: { $ne: acceptedRequest._id },
    status: 'PENDING',
  });

  await FoodRequest.updateMany(
    { donation: donationId, _id: { $ne: acceptedRequest._id }, status: 'PENDING' },
    { $set: { status: 'NOT_SELECTED' } }
  );

  // Send Clean User-Friendly Notification to Selected Receiver
  const acceptedNotif = await Notification.create({
      recipient: receiverId,
      title: 'Request Accepted',
      message: 'Your food request has been accepted.',
    type: 'REQUEST_ACCEPTED',
    relatedDonation: updatedDonation._id,
    relatedRequest: acceptedRequest._id,
  });

  if (io) {
    io.to(`user_${receiverId.toString()}`).emit('REQUEST_ACCEPTED', {
      notification: acceptedNotif,
      donation: updatedDonation,
      donor: {
        name: updatedDonation.donor.name,
        phone: updatedDonation.contactNumber || updatedDonation.donor.phone,
        address: updatedDonation.preciseLocation.address,
      },
    });
  }

  // Send Notifications to Other Receivers
  for (let otherReq of otherPendingRequests) {
    const otherNotif = await Notification.create({
      recipient: otherReq.receiver,
      title: 'Request Status Update',
      message: `Another receiver has been selected for this food donation (${updatedDonation.foodName}).`,
      type: 'REQUEST_NOT_SELECTED',
      relatedDonation: updatedDonation._id,
    });

    if (io) {
      io.to(`user_${otherReq.receiver.toString()}`).emit('REQUEST_NOT_SELECTED', {
        notification: otherNotif,
        donationId: updatedDonation._id,
      });
    }
  }

  // Send Clean User-Friendly Notification to Donor for Fallback
  if (isFallback) {
    const donorMsg = `A receiver has been selected for your food donation "${updatedDonation.foodName}".`;

    const donorNotif = await Notification.create({
      recipient: updatedDonation.donor._id,
      title: 'Receiver Selected 🤝',
      message: donorMsg,
      type: 'FALLBACK_ACCEPTED',
      relatedDonation: updatedDonation._id,
      relatedRequest: acceptedRequest._id,
    });

    if (io) {
      io.to(`user_${updatedDonation.donor._id.toString()}`).emit('FALLBACK_ACCEPTED', {
        notification: donorNotif,
        donation: updatedDonation,
        selectedReceiver: acceptedRequest.receiver,
      });
    }
  }

  return { updatedDonation, acceptedRequest };
};

/**
 * Background Scheduler Worker for Overdue Deadlines & Expiries
 */
const runFallbackCheck = async (io) => {
  try {
    const now = new Date();

    const overdueDonations = await FoodDonation.find({
      status: { $in: ['AVAILABLE', 'REQUESTED'] },
      responseDeadline: { $lte: now },
      expiryTime: { $gt: now },
    });

    for (let donation of overdueDonations) {
      const pendingRequests = await FoodRequest.find({
        donation: donation._id,
        status: 'PENDING',
      }).populate('receiver');

      if (pendingRequests.length === 0) continue;

      const { getBestEligibleRequest } = require('../services/matchingService');
      const selectedRequest = getBestEligibleRequest(donation, pendingRequests);

      if (selectedRequest) {
        console.log(`[Fallback Scheduler]: Selected best receiver "${selectedRequest.receiver.name}" with score ${selectedRequest.matchData?.score}% for donation "${donation.foodName}"`);
        await attemptAtomicAcceptance(donation._id, selectedRequest.receiver._id, true, io);
      }
    }

    // PHASE 12: Process all Active Donations for Urgency and Expiry
    const activeDonations = await FoodDonation.find({
      status: { $nin: ['COMPLETED', 'CANCELLED', 'RECEIVED', 'EXPIRED'] }
    });

    for (let donation of activeDonations) {
      // 1. Process real-time urgency countdown alerts
      await processUrgencyAlerts(donation, 'food', io);
      
      // 2. Process automatic expiry if past time
      await processAutomaticExpiry(donation, 'food', io);
    }
  } catch (error) {
    console.error('[Fallback Scheduler Error]:', error);
  }
};

module.exports = {
  attemptAtomicAcceptance,
  runFallbackCheck,
};

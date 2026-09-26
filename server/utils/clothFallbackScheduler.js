const ClothDonation = require('../models/ClothDonation');
const ClothRequest = require('../models/ClothRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { processUrgencyAlerts, processAutomaticExpiry } = require('./urgencyEngine');

/**
 * Concurrency-Safe Atomic Acceptance Helper for Clothes
 */
const attemptAtomicClothAcceptance = async (donationId, receiverId, isFallback = false, io = null) => {
  const now = new Date();

  // Atomic Condition Update on ClothDonation
  const updatedDonation = await ClothDonation.findOneAndUpdate(
    {
      _id: donationId,
      status: { $in: ['AVAILABLE', 'REQUESTED'] },
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
  const acceptedRequest = await ClothRequest.findOneAndUpdate(
    { donation: donationId, receiver: receiverId, status: 'PENDING' },
    { $set: { status: 'ACCEPTED', acceptedAt: now } },
    { new: true }
  ).populate('receiver', 'name email phone city');

  if (!acceptedRequest) {
    await ClothDonation.findByIdAndUpdate(donationId, { status: 'AVAILABLE', acceptedReceiver: null });
    return null;
  }

  // Update all remaining pending requests to NOT_SELECTED
  const otherPendingRequests = await ClothRequest.find({
    donation: donationId,
    _id: { $ne: acceptedRequest._id },
    status: 'PENDING',
  });

  await ClothRequest.updateMany(
    { donation: donationId, _id: { $ne: acceptedRequest._id }, status: 'PENDING' },
    { $set: { status: 'NOT_SELECTED' } }
  );

  // Send Clean User-Friendly Notification to Selected Receiver
  const selectedMsg = `Your request for "${updatedDonation.clothingType}" has been accepted! You can now connect for transfer.`;

  const acceptedNotif = await Notification.create({
    recipient: receiverId,
    title: 'Request Accepted! 🎉',
    message: selectedMsg,
    type: 'CLOTH_REQUEST_ACCEPTED',
    relatedDonation: updatedDonation._id,
    relatedRequest: acceptedRequest._id,
  });

  if (io) {
    io.to(`user_${receiverId.toString()}`).emit('CLOTH_REQUEST_ACCEPTED', {
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
      message: `Another receiver has been selected for this clothes donation (${updatedDonation.clothingType}).`,
      type: 'CLOTH_REQUEST_NOT_SELECTED',
      relatedDonation: updatedDonation._id,
    });

    if (io) {
      io.to(`user_${otherReq.receiver.toString()}`).emit('CLOTH_REQUEST_NOT_SELECTED', {
        notification: otherNotif,
        donationId: updatedDonation._id,
      });
    }
  }

  // Send Clean User-Friendly Notification to Donor for Fallback
  if (isFallback) {
    const donorMsg = `A receiver has been selected for your clothes donation "${updatedDonation.clothingType}".`;

    const donorNotif = await Notification.create({
      recipient: updatedDonation.donor._id,
      title: 'Receiver Selected 🤝',
      message: donorMsg,
      type: 'CLOTH_FALLBACK_ACCEPTED',
      relatedDonation: updatedDonation._id,
      relatedRequest: acceptedRequest._id,
    });

    if (io) {
      io.to(`user_${updatedDonation.donor._id.toString()}`).emit('CLOTH_FALLBACK_ACCEPTED', {
        notification: donorNotif,
        donation: updatedDonation,
        selectedReceiver: acceptedRequest.receiver,
      });
    }
  }

  return { updatedDonation, acceptedRequest };
};

/**
 * Background Scheduler Worker for Clothes Fallback & Expiry
 */
const runClothFallbackCheck = async (io) => {
  // Clothes no longer have expiryTime or responseDeadline.
  // We explicitly disable urgency alerts, automatic expiry, and automatic fallback for Clothes.
  return;
};

module.exports = {
  attemptAtomicClothAcceptance,
  runClothFallbackCheck,
};

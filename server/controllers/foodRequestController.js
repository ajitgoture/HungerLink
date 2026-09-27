const FoodRequest = require('../models/FoodRequest');
const FoodDonation = require('../models/FoodDonation');
const Notification = require('../models/Notification');
const { attemptAtomicAcceptance } = require('../utils/fallbackScheduler');

// @route   POST /api/food/requests
const createRequest = async (req, res) => {
  try {
    const { donationId, requestedQuantity } = req.body;
    const receiverId = req.user._id;

    if (!req.user || !req.user.role || !req.user.role.toLowerCase().includes('receiver')) {
      return res.status(403).json({ message: 'Only authorized receivers can request donations.' });
    }

    const donation = await FoodDonation.findById(donationId).populate('donor');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const now = new Date();
    if (donation.expiryTime <= now || donation.status === 'EXPIRED') {
      return res.status(400).json({ message: 'This donation has expired and cannot accept requests.' });
    }

    if (donation.donor._id.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'You cannot request your own donation.' });
    }

    if (['ACCEPTED', 'RECEIVED', 'COMPLETED', 'EXPIRED'].includes(donation.status)) {
      return res.status(400).json({ message: 'This donation has already been assigned or completed.' });
    }

    if (requestedQuantity && (requestedQuantity <= 0 || requestedQuantity > donation.quantity)) {
      return res.status(400).json({ message: 'Invalid requested quantity.' });
    }

    if (donation.quantity <= 0) {
      return res.status(400).json({ message: 'This donation has no available quantity remaining.' });
    }

    const existingRequest = await FoodRequest.findOne({
      donation: donationId,
      receiver: receiverId,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested this food donation.' });
    }

    const request = await FoodRequest.create({
      donation: donationId,
      donor: donation.donor._id,
      receiver: receiverId,
      requestedQuantity: requestedQuantity || donation.quantity,
      status: 'PENDING',
      requestedAt: now,
    });

    if (donation.status === 'AVAILABLE') {
      donation.status = 'REQUESTED';
      await donation.save();
    }

    // 1. User-Friendly Notification for Donor
    const donorNotif = await Notification.create({
      recipient: donation.donor._id,
      title: 'New Food Request',
      message: 'New food request received.',
      relatedRequest: request._id,
    });

    // 2. User-Friendly Notification for Receiver
    const receiverNotif = await Notification.create({
      recipient: receiverId,
      title: 'Request Submitted ✨',
      message: `Your request for "${donation.foodName}" has been submitted successfully.`,
      type: 'FOOD_REQUEST_SENT',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${donation.donor._id.toString()}`).emit('FOOD_REQUESTED', {
        notification: donorNotif,
        request: await request.populate([
          { path: 'receiver', select: 'name city phone' },
          { path: 'donation' }
        ]),
        donation,
      });
      io.to(`user_${receiverId.toString()}`).emit('notification:new', receiverNotif);
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error.message);
    res.status(500).json({ message: 'Server error submitting request' });
  }
};

// @route   GET /api/food/requests/donor
const getDonorRequests = async (req, res) => {
  try {
    const requests = await FoodRequest.find({ donor: req.user._id })
      .populate('receiver', 'name email phone city address location reliabilityScore')
      .populate('donation')
      .sort({ createdAt: -1 });

    const { calculateMatchScore } = require('../services/matchingService');
    const enrichedRequests = requests.map(req => {
      const matchData = calculateMatchScore(req.donation, req);
      const reqObj = req.toObject ? req.toObject() : req;
        if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.status !== 'READY_FOR_PICKUP' && reqObj.status !== 'HANDOVER_PENDING') {
           if (reqObj.receiver) {
             delete reqObj.receiver.address;
             delete reqObj.receiver.phone;
           }
           if (reqObj.requester) {
             delete reqObj.requester.address;
             delete reqObj.requester.phone;
           }
        }
        return {
          ...reqObj,
          matchData
        };
    });

    // Optionally sort by score if they are pending, else keep newest first
    enrichedRequests.sort((a, b) => {
      if (a.status === 'PENDING' && b.status === 'PENDING') return b.matchData.score - a.matchData.score;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor requests' });
  }
};

// @route   GET /api/food/requests/receiver
const getReceiverRequests = async (req, res) => {
  try {
    const requests = await FoodRequest.find({ receiver: req.user._id })
      .populate('donor', 'name email phone city address')
      .populate('donation')
      .sort({ createdAt: -1 });
    
      // PRIVACY: Remove precise location and contact info if request is not accepted
      const secureRequests = requests.map(req => {
        const reqObj = req.toObject ? req.toObject() : req;
        if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.status !== 'READY_FOR_PICKUP' && reqObj.status !== 'HANDOVER_PENDING' && reqObj.status !== 'ARRIVED') {
           if (reqObj.donation) {
             delete reqObj.donation.preciseLocation;
             delete reqObj.donation.contactNumber;
           }
           if (reqObj.donor) {
              delete reqObj.donor.address;
              delete reqObj.donor.phone;
           }
        }
        return reqObj;
      });
      res.json(secureRequests);
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receiver requests' });
  }
};

// @route   PATCH /api/food/requests/:id/accept
const acceptRequest = async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can accept this request' });
    }

    const io = req.app.get('socketio');
    const result = await attemptAtomicAcceptance(request.donation, request.receiver, false, io);

    if (!result) {
      return res.status(400).json({
        message: 'Unable to accept request. Another receiver was already assigned or the donation has expired.',
      });
    }

    res.json({
      message: 'Food request accepted successfully',
      request: result.acceptedRequest,
      donation: result.updatedDonation,
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Error accepting request' });
  }
};

// @route   PATCH /api/food/requests/:id/reject
const rejectRequest = async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id).populate('donation');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can reject this request' });
    }

    request.status = 'REJECTED';
    request.rejectedAt = new Date();
    await request.save();

    const remainingPending = await FoodRequest.countDocuments({
      donation: request.donation._id,
      status: 'PENDING',
    });

    if (remainingPending === 0 && request.donation.status === 'REQUESTED') {
      await FoodDonation.findByIdAndUpdate(request.donation._id, { status: 'AVAILABLE' });
    }

    const rejectNotif = await Notification.create({
      recipient: request.receiver,
      title: 'Request Status Update',
      message: `Your request for "${request.donation.foodName}" was not accepted.`,
      type: 'REQUEST_REJECTED',
      relatedDonation: request.donation._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${request.receiver.toString()}`).emit('REQUEST_REJECTED', {
        notification: rejectNotif,
      });
    }

    res.json({ message: 'Request rejected', request });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request' });
  }
};

// @route   PATCH /api/food/requests/:id/confirm-received
const confirmFoodReceived = async (req, res) => {
  try {
    const request = await FoodRequest.findById(req.params.id).populate('donation');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the accepted receiver can confirm food received' });
    }

    const now = new Date();

    request.status = 'COMPLETED';
    request.receivedAt = now;
    request.completedAt = now;
    await request.save();

    const donation = await FoodDonation.findById(request.donation._id);
    if (donation) {
      if (request.requestedQuantity && request.requestedQuantity < donation.quantity) {
          donation.quantity -= request.requestedQuantity;
          donation.status = 'AVAILABLE';
          donation.acceptedReceiver = null;
          donation.handoverVerified = false;
          donation.handoverToken = null;
          donation.handoverTokenExpiry = null;
          donation.receivedAt = null;
          donation.completedAt = null;
        } else {
          donation.status = 'COMPLETED';
          donation.receivedAt = now;
          donation.completedAt = now;
        }
        await donation.save();
    }

    // User-Friendly Notification for Donor
    const completionNotifDonor = await Notification.create({
      recipient: request.donor,
      title: 'Donation Completed! ❤️',
      message: `Your food donation "${donation.foodName}" has been completed successfully.`,
      type: 'DONATION_COMPLETED',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    // User-Friendly Notification for Receiver
    const completionNotifReceiver = await Notification.create({
      recipient: request.receiver,
      title: 'Request Completed! ❤️',
      message: `Your food request for "${donation.foodName}" has been completed successfully.`,
      type: 'DONATION_COMPLETED',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${request.donor.toString()}`).emit('DONATION_COMPLETED', {
        notification: completionNotifDonor,
        donationId: donation._id,
      });
      io.to(`user_${request.receiver.toString()}`).emit('notification:new', completionNotifReceiver);
    }

    res.json({
      message: 'Thank you! The food donation has been completed successfully.',
      request,
      donation,
    });
  } catch (error) {
    console.error('Confirm received error:', error);
    res.status(500).json({ message: 'Error confirming food received' });
  }
};

module.exports = {
  createRequest,
  getDonorRequests,
  getReceiverRequests,
  acceptRequest,
  rejectRequest,
  confirmFoodReceived,
};

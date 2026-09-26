const ClothRequest = require('../models/ClothRequest');
const ClothDonation = require('../models/ClothDonation');
const Notification = require('../models/Notification');
const { attemptAtomicClothAcceptance } = require('../utils/clothFallbackScheduler');

// @route   POST /api/cloth/requests
const createClothRequest = async (req, res) => {
  try {
    const { donationId, donation: altDonationId } = req.body;
    const targetDonationId = donationId || altDonationId;
    const receiverId = req.user._id;

    if (!req.user || !req.user.role || !req.user.role.toLowerCase().includes('receiver')) {
      return res.status(403).json({ message: 'Only authorized receivers can request clothes.' });
    }

    if (!targetDonationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    const donation = await ClothDonation.findById(targetDonationId).populate('donor');
    if (!donation) {
      return res.status(404).json({ message: 'Clothes donation not found' });
    }

    const now = new Date();
    if (donation.status === 'EXPIRED') {
      return res.status(400).json({ message: 'This clothes donation has expired and cannot accept requests.' });
    }

    const donorId = donation.donor?._id || donation.donor;

    if (donorId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'You cannot request your own clothes donation.' });
    }

    if (['ACCEPTED', 'RECEIVED', 'COMPLETED', 'EXPIRED'].includes(donation.status)) {
      return res.status(400).json({ message: 'This clothes donation has already been assigned or completed.' });
    }

    if (req.body.requestedItems && req.body.requestedItems.length > 0) {
      for (let reqItem of req.body.requestedItems) {
        const itemDoc = donation.items.id ? donation.items.id(reqItem.itemId) : donation.items.find(i => i._id.toString() === reqItem.itemId.toString());
        if (!itemDoc || reqItem.quantity <= 0 || reqItem.quantity > itemDoc.quantity) {
          return res.status(400).json({ message: 'Invalid requested items or quantities.' });
        }
      }
    }

    const existingRequest = await ClothRequest.findOne({
      donation: targetDonationId,
      receiver: receiverId,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested this clothing donation.' });
    }

    const request = await ClothRequest.create({
      donation: targetDonationId,
      donor: donorId,
      receiver: receiverId,
      requestedItems: req.body.requestedItems || [],
      status: 'PENDING',
      requestedAt: now,
    });

    if (donation.status === 'AVAILABLE') {
      donation.status = 'REQUESTED';
      await donation.save();
    }

    // 1. User-Friendly Notification for Donor
    const donorNotif = await Notification.create({
      recipient: donorId,
      title: 'New Request Received 👕',
      message: `Your clothes donation "${donation.clothingType}" has received a new request.`,
      type: 'CLOTH_REQUESTED',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    // 2. User-Friendly Notification for Receiver
    const receiverNotif = await Notification.create({
      recipient: receiverId,
      title: 'Request Submitted 📋',
      message: `Your request for "${donation.clothingType}" has been submitted successfully.`,
      type: 'CLOTH_REQUEST_SENT',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    const populatedRequest = await ClothRequest.findById(request._id)
      .populate('donor', 'name email phone city address')
      .populate('receiver', 'name email phone city address')
      .populate('donation');

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${donorId.toString()}`).emit('CLOTH_REQUESTED', {
        notification: donorNotif,
        request: populatedRequest,
        donation,
      });
      io.to(`user_${receiverId.toString()}`).emit('notification:new', receiverNotif);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error creating clothes request:', error.message);
    res.status(500).json({ message: 'Server error submitting clothes request' });
  }
};

// @route   GET /api/cloth/requests/donor
const getDonorClothRequests = async (req, res) => {
  try {
    const requests = await ClothRequest.find({ donor: req.user._id })
      .populate('receiver', 'name email phone city address location reliabilityScore')
      .populate('donor', 'name email phone city address')
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

    enrichedRequests.sort((a, b) => {
      if (a.status === 'PENDING' && b.status === 'PENDING') return b.matchData.score - a.matchData.score;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(enrichedRequests);
  } catch (error) {
    console.error('Error fetching donor clothes requests:', error);
    res.status(500).json({ message: 'Error fetching donor requests' });
  }
};

// @route   GET /api/cloth/requests/receiver
const getReceiverClothRequests = async (req, res) => {
  try {
    const requests = await ClothRequest.find({ receiver: req.user._id })
      .populate('donor', 'name email phone city address')
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email phone city address' },
      })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching receiver clothes requests:', error);
    res.status(500).json({ message: 'Error fetching receiver requests' });
  }
};

// @route   PATCH /api/cloth/requests/:id/accept
const acceptClothRequest = async (req, res) => {
  try {
    const request = await ClothRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can accept this request' });
    }

    const io = req.app.get('socketio');
    const result = await attemptAtomicClothAcceptance(request.donation, request.receiver, false, io);

    if (!result) {
      return res.status(400).json({
        message: 'Unable to accept request. Another receiver was already assigned.',
      });
    }

    res.json({
      message: 'Clothes request accepted successfully',
      request: result.acceptedRequest,
      donation: result.updatedDonation,
    });
  } catch (error) {
    console.error('Accept clothes request error:', error);
    res.status(500).json({ message: 'Error accepting request' });
  }
};

// @route   PATCH /api/cloth/requests/:id/reject
const rejectClothRequest = async (req, res) => {
  try {
    const request = await ClothRequest.findById(req.params.id).populate('donation');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can reject this request' });
    }

    request.status = 'REJECTED';
    request.rejectedAt = new Date();
    await request.save();

    const remainingPending = await ClothRequest.countDocuments({
      donation: request.donation._id,
      status: 'PENDING',
    });

    if (remainingPending === 0 && request.donation.status === 'REQUESTED') {
      await ClothDonation.findByIdAndUpdate(request.donation._id, { status: 'AVAILABLE' });
    }

    const rejectNotif = await Notification.create({
      recipient: request.receiver,
      title: 'Request Status Update',
      message: `Your request for "${request.donation.clothingType}" was not accepted.`,
      type: 'CLOTH_REQUEST_REJECTED',
      relatedDonation: request.donation._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${request.receiver.toString()}`).emit('CLOTH_REQUEST_REJECTED', {
        notification: rejectNotif,
      });
    }

    res.json({ message: 'Request rejected', request });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request' });
  }
};

// @route   PATCH /api/cloth/requests/:id/confirm-received
const confirmClothReceived = async (req, res) => {
  try {
    const request = await ClothRequest.findById(req.params.id).populate('donation');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the accepted receiver can confirm clothes received' });
    }

    const now = new Date();

    request.status = 'COMPLETED';
    request.receivedAt = now;
    request.completedAt = now;
    await request.save();

    const donation = await ClothDonation.findById(request.donation._id);
    if (donation) {
      donation.status = 'COMPLETED';
      donation.receivedAt = now;
      donation.completedAt = now;
      await donation.save();
    }

    // User-Friendly Notification for Donor
    const completionNotifDonor = await Notification.create({
      recipient: request.donor,
      title: 'Donation Completed! ❤️',
      message: `Your clothes donation "${donation.clothingType}" has been completed successfully.`,
      type: 'CLOTH_DONATION_COMPLETED',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    // User-Friendly Notification for Receiver
    const completionNotifReceiver = await Notification.create({
      recipient: request.receiver,
      title: 'Request Completed! ❤️',
      message: `Your clothes request for "${donation.clothingType}" has been completed successfully.`,
      type: 'CLOTH_DONATION_COMPLETED',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${request.donor.toString()}`).emit('CLOTH_DONATION_COMPLETED', {
        notification: completionNotifDonor,
        donationId: donation._id,
      });
      io.to(`user_${request.receiver.toString()}`).emit('notification:new', completionNotifReceiver);
    }

    res.json({
      message: 'Thank you! The clothes donation has been completed successfully.',
      request,
      donation,
    });
  } catch (error) {
    console.error('Confirm clothes received error:', error);
    res.status(500).json({ message: 'Error confirming clothes received' });
  }
};

module.exports = {
  createClothRequest,
  getDonorClothRequests,
  getReceiverClothRequests,
  acceptClothRequest,
  rejectClothRequest,
  confirmClothReceived,
};

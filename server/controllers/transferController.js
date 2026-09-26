const processAutomaticExpiry = require('../utils/urgencyEngine').processAutomaticExpiry || (async () => {});
const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Map to get the correct model
const getModel = (moduleType) => {
  if (moduleType === 'food') return FoodDonation;
  if (moduleType === 'cloth') return ClothDonation;
  throw new Error('Invalid module type');
};

/**
 * Standardized notification pusher for Transfer Events
 */
const notifyBothParticipants = async (req, donation, title, message) => {
  const donorId = donation.donor._id?.toString() || donation.donor.toString();
  const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();
  const io = req.app.get('socketio');
  
  for (const recipientId of [donorId, receiverId]) {
    if (!recipientId) continue;
    const notif = await Notification.create({
      recipient: recipientId,
      type: 'TRANSFER_UPDATE',
      title,
      message,
      relatedDonation: donation._id
    });
    
    if (io) {
      io.to(`user_${recipientId}`).emit('notification:new', notif);
      io.to(`user_${recipientId}`).emit('TRANSFER_UPDATE', { message });
    }
  }
};

const notifyTransferUpdate = async (req, donation, title, message) => {
  const donorId = donation.donor._id?.toString() || donation.donor.toString();
  const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();

  const recipientId = req.user._id.toString() === donorId ? receiverId : donorId;
  
  if (!recipientId) return;

  const notif = await Notification.create({
    recipient: recipientId,
    type: 'TRANSFER_UPDATE',
    title,
    message,
    relatedDonation: donation._id
  });

  const io = req.app.get('socketio');
  if (io) {
    io.to(`user_${recipientId}`).emit('notification:new', notif);
    // Also emit a general transfer update if clients are listening directly
    io.to(`user_${recipientId}`).emit('TRANSFER_UPDATE', { message });
  }
};

/**
 * Validates permissions: Only donor or accepted receiver can modify.
 */
const validateParticipant = (donation, userId) => {
  const donorId = donation.donor._id?.toString() || donation.donor.toString();
  const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();

  if (userId !== donorId && userId !== receiverId) {
    throw new Error('Unauthorized participant');
  }
  return { isDonor: userId === donorId, isReceiver: userId === receiverId };
};

// Generic State Machine Verifier
const verifyTransition = (currentStatus, targetStatus) => {
  const flow = {
    'ACCEPTED': ['TRANSFER_METHOD_SELECTED', 'CANCELLED'],
    'TRANSFER_METHOD_SELECTED': ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
    'READY_FOR_PICKUP': ['ON_THE_WAY', 'ARRIVED', 'CANCELLED'],
    'OUT_FOR_DELIVERY': ['ON_THE_WAY', 'ARRIVED', 'CANCELLED'],
    'ON_THE_WAY': ['ARRIVED', 'CANCELLED'],
    'ARRIVED': ['HANDOVER_PENDING', 'CANCELLED'],
    'HANDOVER_PENDING': ['RECEIVED', 'COMPLETED', 'CANCELLED'],
    // To support legacy endpoints that might jump to completed
    'RECEIVED': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': []
  };

  const allowed = flow[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new Error(`Invalid state transition from ${currentStatus} to ${targetStatus}`);
  }
};

// 1. Select Transfer Method (Pickup or Delivery)
const setTransferMethod = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const { method } = req.body; // 'PICKUP' or 'DELIVERY'
    
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const { isDonor } = validateParticipant(donation, req.user._id.toString());
    
    // STRICT SECURITY: Only the donor should set the transfer method (how they are offering it)
    if (!isDonor) {
      return res.status(403).json({ message: 'Only the donor can set the transfer method.' });
    }

    verifyTransition(donation.status, 'TRANSFER_METHOD_SELECTED');

    donation.status = 'TRANSFER_METHOD_SELECTED';
    
    // Jump straight to the READY state for UX convenience, based on the prompt's preference
    const nextState = method === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
    verifyTransition(donation.status, nextState);
    donation.status = nextState;
    donation.transferMethod = method;

    await donation.save();

    await notifyTransferUpdate(
      req, 
      donation, 
      'Transfer Method Set', 
      `Donor set the transfer method to ${method}. Status is now ${nextState}.`
    );

    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 1.5 Mark On The Way
const markOnTheWay = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    
    const { isDonor, isReceiver } = validateParticipant(donation, req.user._id.toString());
    
    // STRICT SECURITY: Receiver travels if Pickup, Donor travels if Delivery
    if (donation.status === 'READY_FOR_PICKUP' && !isReceiver) {
      return res.status(403).json({ message: 'Only the receiver can start pickup for Pickup transfers.' });
    }
    if (donation.status === 'OUT_FOR_DELIVERY' && !isDonor) {
      return res.status(403).json({ message: 'Only the donor can start delivery for Delivery transfers.' });
    }

    verifyTransition(donation.status, 'ON_THE_WAY');

    donation.status = 'ON_THE_WAY';
    await donation.save();

    await notifyTransferUpdate(req, donation, 'Partner is On The Way', 'The transfer partner has started their journey.');
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. Mark Arrived
const markArrived = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    
    const { isDonor, isReceiver } = validateParticipant(donation, req.user._id.toString());
    
    // STRICT SECURITY: Receiver arrives if Pickup, Donor arrives if Delivery
    if ((donation.status === 'READY_FOR_PICKUP' || (donation.status === 'ON_THE_WAY' && donation.transferMethod === 'PICKUP')) && !isReceiver) {
      return res.status(403).json({ message: 'Only the receiver can mark as arrived for Pickup transfers.' });
    }
    if ((donation.status === 'OUT_FOR_DELIVERY' || (donation.status === 'ON_THE_WAY' && donation.transferMethod === 'DELIVERY')) && !isDonor) {
      return res.status(403).json({ message: 'Only the donor can mark as arrived for Delivery transfers.' });
    }

    verifyTransition(donation.status, 'ARRIVED');

    donation.status = 'ARRIVED';
    await donation.save();

    await notifyTransferUpdate(req, donation, 'Partner Arrived', 'The transfer partner has arrived at the location.');
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Handover Pending (Confirmation step)
const initiateHandover = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    
    const { isDonor } = validateParticipant(donation, req.user._id.toString());
    
    // STRICT SECURITY: Only donor can initiate handover / prompt for QR scanning
    if (!isDonor) {
      return res.status(403).json({ message: 'Only the donor can initiate handover.' });
    }

    verifyTransition(donation.status, 'HANDOVER_PENDING');

    donation.status = 'HANDOVER_PENDING';
    await donation.save();

    await notifyTransferUpdate(req, donation, 'Handover Initiated', 'Please confirm the handover is complete.');
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Complete Transfer
const completeTransfer = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const { fallbackReason, proofImage } = req.body || {};
    
    const userId = req.user._id.toString();
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    const { isDonor, isReceiver } = validateParticipant(donation, userId);
    
    verifyTransition(donation.status, 'COMPLETED');

    if (!donation.handoverVerified && !fallbackReason) {
      return res.status(400).json({ message: 'Handover must be verified via QR code, or a fallback reason must be provided.' });
    }

    // STRICT SECURITY: If fallback reason is used, ensure it is the DONOR completing it. 
    // If QR was verified natively, either could theoretically trigger completion API.
    if (!donation.handoverVerified && !isDonor) {
      return res.status(403).json({ message: 'Only the donor can complete a transfer using a fallback reason.' });
    }

    // Fetch the active request to determine the quantity claimed
    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: 'ACCEPTED'
    });

    if (activeRequest) {
      activeRequest.status = 'COMPLETED';
      activeRequest.completedAt = new Date();
      await activeRequest.save();
      
      let fullyClaimed = true;
      let weight = 0;
      let clothesItems = 0;

      if (moduleType === 'food') {
        const reqQty = activeRequest.requestedQuantity || donation.quantity;
        weight = reqQty;
        
        if (reqQty < donation.quantity) {
          donation.quantity -= reqQty;
          fullyClaimed = false;
        } else {
          donation.quantity = 0;
        }
      } else if (moduleType === 'cloth') {
        if (activeRequest.requestedItems && activeRequest.requestedItems.length > 0) {
          let totalRemaining = 0;
          
          activeRequest.requestedItems.forEach(reqItem => {
            const itemDoc = donation.items.id ? donation.items.id(reqItem.itemId) : donation.items.find(i => i._id.toString() === reqItem.itemId.toString());
            if (itemDoc) {
              clothesItems += reqItem.quantity;
              itemDoc.quantity = Math.max(0, itemDoc.quantity - reqItem.quantity);
            }
          });

          donation.items.forEach(item => {
            totalRemaining += item.quantity;
          });
          
          if (totalRemaining > 0) {
            fullyClaimed = false;
          }
        } else {
          donation.items.forEach(item => {
            clothesItems += item.quantity;
            item.quantity = 0;
          });
        }
      }

      try {
        const ImpactStats = require('../models/ImpactStats');
        await ImpactStats.findOneAndUpdate({}, {
          $inc: { 
            totalDonationsCompleted: 1,
            totalFoodSavedKg: weight,
            totalClothesDonated: clothesItems || 1
          }
        }, { upsert: true });
      } catch(e) { console.error('Stat update error:', e); }

      if (!fullyClaimed) {
        donation.status = 'AVAILABLE';
        donation.acceptedReceiver = null;
        donation.handoverVerified = false;
        donation.handoverToken = null;
        donation.handoverTokenExpiry = null;
        donation.handoverFallbackReason = null;
        donation.transferMethod = null;
      } else {
        donation.status = 'COMPLETED';
        donation.completedAt = new Date();
      }
    } else {
      donation.status = 'COMPLETED';
      donation.completedAt = new Date();
    }

    if (fallbackReason) {
      donation.handoverFallbackReason = fallbackReason;
      if (proofImage) donation.handoverProofImage = proofImage;
    }

    await donation.save();

    await notifyBothParticipants(req, donation, 'Transfer Completed', `Transfer was marked complete.`);
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 5. Cancel Transfer
const cancelTransfer = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const { reason } = req.body;
    
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    const { isDonor } = validateParticipant(donation, req.user._id.toString());
    verifyTransition(donation.status, 'CANCELLED');

    donation.status = 'CANCELLED';
    await donation.save();

    // Revert the request
    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: 'ACCEPTED'
    });
    if (activeRequest) {
      activeRequest.status = 'REJECTED';
      await activeRequest.save();
    }

    await notifyTransferUpdate(req, donation, 'Transfer Cancelled', `Transfer was cancelled by ${isDonor ? 'Donor' : 'Receiver'}. Reason: ${reason || 'Not provided'}`);
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Generate Handover Token (Donor)
const generateHandoverToken = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const userId = req.user._id.toString();

    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    validateParticipant(donation, userId);
    
    // Must be donor
    if (donation.donor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the donor can generate the handover token' });
    }

    const io = req.app.get('socketio');
    if (donation.expiryTime && new Date(donation.expiryTime) < new Date()) {
      await processAutomaticExpiry(donation, moduleType, io);
      return res.status(400).json({ message: 'This donation has expired and cannot be collected.' });
    }
    
    if (donation.status !== 'HANDOVER_PENDING') {
      return res.status(400).json({ message: 'Transfer is not in HANDOVER_PENDING state' });
    }

    // Generate 6 digit numeric code
    const token = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60000); // 15 mins

    donation.handoverToken = token;
    donation.handoverTokenExpiry = expiry;
    await donation.save();

    // Fetch associated Request ID
    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: 'ACCEPTED'
    });

    const qrPayload = JSON.stringify({
      donationId: donation._id.toString(),
      requestId: activeRequest ? activeRequest._id.toString() : null,
      donorId: donation.donor.toString(),
      receiverId: donation.acceptedReceiver.toString(),
      token: token,
      purpose: 'HungerLink_Handover_Verification'
    });

    res.json({
      token,
      expiresAt: expiry,
      qrPayload
    });
  } catch (error) {
    console.error('Error generating handover token:', error);
    res.status(500).json({ message: 'Failed to generate token' });
  }
};

// Verify Handover Token (Receiver)
const verifyHandoverToken = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const { token } = req.body;
    const userId = req.user._id.toString();

    if (!token) return res.status(400).json({ message: 'Token is required' });

    const Model = getModel(moduleType);
    // Include the hidden select fields
    let donation = await Model.findById(donationId).select('+handoverToken +handoverTokenExpiry +handoverVerified +expiryTime');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    validateParticipant(donation, userId);

    // Must be receiver
    if (donation.acceptedReceiver.toString() !== userId) {
      return res.status(403).json({ message: 'Only the receiver can verify the handover token' });
    }

    if (donation.status !== 'HANDOVER_PENDING') {
      return res.status(400).json({ message: 'Transfer is not in HANDOVER_PENDING state' });
    }

    if (!donation.handoverToken) {
      return res.status(400).json({ message: 'No active handover token found' });
    }

    if (new Date() > new Date(donation.handoverTokenExpiry)) {
      return res.status(400).json({ message: 'Handover token has expired' });
    }

    if (donation.handoverToken !== token.toString()) {
      return res.status(400).json({ message: 'Invalid handover token' });
    }

    // Verify corresponding Request explicitly
    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: 'ACCEPTED'
    });
    
    if (!activeRequest) {
      return res.status(400).json({ message: 'No active accepted request found for this transfer.' });
    }

    verifyTransition(donation.status, 'RECEIVED');

    // Verification successful
    donation.status = 'RECEIVED';
    donation.handoverVerified = true;
    donation.handoverToken = null;
    donation.handoverTokenExpiry = null;
    await donation.save();

    await notifyBothParticipants(req, donation, 'Handover Verified', 'The handover token was verified successfully.');

    res.json({ message: 'Handover verified securely' });
  } catch (error) {
    console.error('Error verifying handover token:', error);
    res.status(500).json({ message: 'Failed to verify token' });
  }
};

module.exports = {
  setTransferMethod,
  markOnTheWay,
  markArrived,
  initiateHandover,
  completeTransfer,
  cancelTransfer,
  generateHandoverToken,
  verifyHandoverToken
};

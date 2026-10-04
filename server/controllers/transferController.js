const processAutomaticExpiry = require('../utils/urgencyEngine').processAutomaticExpiry || (async () => {});
const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');
const Notification = require('../models/Notification');
const { assertValidTransition } = require('../utils/transferState');
const {
  PROXIMITY_THRESHOLDS_METERS,
  hasValidCoordinates,
  calculateDistanceMeters,
  recordParticipantArrival,
} = require('../utils/transferLocation');
const { sanitizeGeoPointField, toGeoPoint } = require('../utils/locationValidator');
const crypto = require('crypto');
const ACTIVE_TRANSFER_REQUEST_STATUSES = Object.freeze([
  'ACCEPTED', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED', 'HANDOVER_READY', 'QR_VERIFIED'
]);

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
      titleCode: title,
      messageCode: message,
      relatedDonation: donation._id
    });
    
    if (io) {
      io.to(`user_${recipientId}`).emit('notification:new', notif);
      io.to(`user_${recipientId}`).emit('TRANSFER_UPDATE', { message });
    // Also emit to the sender to force their own UI to refresh without a manual page reload
    if (req.user && req.user._id) {
      io.to(`user_${req.user._id.toString()}`).emit('TRANSFER_UPDATE', { message });
    }
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
  assertValidTransition(currentStatus, targetStatus);
};

const syncActiveRequestStatus = async (moduleType, donation, status) => {
  const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
  await RequestModel.findOneAndUpdate(
    {
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: { $in: ACTIVE_TRANSFER_REQUEST_STATUSES },
    },
    { $set: { status } }
  );
};

const sanitizeSessionLiveLocations = (session) => {
  if (!session) return session;

  const fields = ['donorLiveLocation', 'receiverLiveLocation'];
  for (const field of fields) {
    if (session[field] !== undefined && session[field] !== null && !sanitizeGeoPointField(session[field])) {
      delete session[field];
    }
  }

  return session;
};

const ensureLocationSession = async (moduleType, donation, requestId = null) => {
  const LocationSessionModel = moduleType === 'food'
    ? require('../models/FoodLocationSession')
    : require('../models/ClothLocationSession');

  let session = await LocationSessionModel.findOne({ donation: donation._id });

  if (!session) {
    const donorId = donation.donor?._id?.toString() || donation.donor.toString();
    const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver.toString();

    const donationCoords = donation.location?.coordinates;
    const preciseDonationCoords = donation.preciseLocation && Number.isFinite(donation.preciseLocation.lng) && Number.isFinite(donation.preciseLocation.lat)
      ? [Number(donation.preciseLocation.lng), Number(donation.preciseLocation.lat)]
      : undefined;
    const receiverCoords = donation.acceptedReceiverLocation?.coordinates || undefined;

    const handoverCoords = donation.transferMethod === 'DELIVERY'
      ? receiverCoords || preciseDonationCoords || donationCoords
      : donationCoords || preciseDonationCoords;

    const sessionPayload = {
      donation: donation._id,
      request: requestId,
      donor: donorId,
      receiver: receiverId,
      trackingMode: donation.transferMethod || 'PENDING',
      transferMethod: donation.transferMethod || 'PENDING',
      trackingStatus: 'WAITING',
      donorStartLocation: toGeoPoint(donation.preciseLocation?.lat, donation.preciseLocation?.lng) || toGeoPoint(donation.location?.coordinates?.[1], donation.location?.coordinates?.[0]),
      receiverStartLocation: toGeoPoint(donation.acceptedReceiverLocation?.lat, donation.acceptedReceiverLocation?.lng) || toGeoPoint(receiverCoords?.[1], receiverCoords?.[0]),
      handoverLocation: toGeoPoint(handoverCoords?.[1], handoverCoords?.[0]),
    };

    session = await LocationSessionModel.create(sessionPayload);
  } else {
    sanitizeSessionLiveLocations(session);
  }

  return session;
};

// 1. Select Transfer Method (Pickup or Delivery)
const setTransferMethod = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const { method } = req.body; // 'PICKUP' or 'DELIVERY'
    if (!['PICKUP', 'DELIVERY'].includes(method)) {
      return res.status(400).json({ message: 'Transfer method must be PICKUP or DELIVERY.' });
    }
    
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const { isDonor } = validateParticipant(donation, req.user._id.toString());
    
    // STRICT SECURITY: Only the donor should set the transfer method (how they are offering it)
    if (!isDonor) {
      return res.status(403).json({ message: 'Only the donor can set the transfer method.' });
    }

    const nextState = method === 'PICKUP' ? 'READY_FOR_PICKUP' : 'READY_FOR_DELIVERY';
    verifyTransition(donation.status, nextState);

    // Create or update Location Session unified state
    const LocationSessionModel = moduleType === 'food' 
      ? require('../models/FoodLocationSession') 
      : require('../models/ClothLocationSession');

    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: { $in: ACTIVE_TRANSFER_REQUEST_STATUSES }
    });

    const storedDonationPoint = donation.location?.coordinates;
    const preciseDonationPoint = storedDonationPoint?.length === 2
      && hasValidCoordinates(storedDonationPoint[1], storedDonationPoint[0])
      ? storedDonationPoint
      : (donation.preciseLocation?.lat != null && donation.preciseLocation?.lng != null
        ? [donation.preciseLocation.lng, donation.preciseLocation.lat]
        : null);
    const requestReceiverPoint = activeRequest?.receiverLocation?.coordinates;
    let receiverPoint = requestReceiverPoint?.length === 2
      && hasValidCoordinates(requestReceiverPoint[1], requestReceiverPoint[0])
      ? requestReceiverPoint
      : null;
    if (!receiverPoint && donation.acceptedReceiver) {
      const receiver = await require('../models/User').findById(donation.acceptedReceiver).select('location');
      const profilePoint = receiver?.location?.coordinates;
      if (profilePoint?.length === 2 && hasValidCoordinates(profilePoint[1], profilePoint[0])) {
        receiverPoint = profilePoint;
      }
    }
    const pickupDestination = preciseDonationPoint?.length === 2
      && hasValidCoordinates(preciseDonationPoint[1], preciseDonationPoint[0])
      ? { type: 'Point', coordinates: preciseDonationPoint }
      : undefined;
    const deliveryDestination = receiverPoint?.length === 2
      && hasValidCoordinates(receiverPoint[1], receiverPoint[0])
      ? { type: 'Point', coordinates: receiverPoint }
      : undefined;
    const handoverLocation = method === 'PICKUP' ? pickupDestination : deliveryDestination;
    donation.status = nextState;
    donation.transferMethod = method;
    await donation.save();
    if (activeRequest) {
      activeRequest.status = nextState;
      await activeRequest.save();
    }

    let session = await LocationSessionModel.findOne({ donation: donationId });
    if (!session) {
      session = await LocationSessionModel.create({
        donation: donationId,
        request: activeRequest ? activeRequest._id : null,
        donor: donation.donor,
        receiver: donation.acceptedReceiver,
        trackingMode: method,
        transferMethod: method, // legacy fallback
        trackingStatus: 'WAITING',
        handoverLocation: handoverLocation && Array.isArray(handoverLocation.coordinates) ? handoverLocation : undefined,
        donorStartLocation: pickupDestination && Array.isArray(pickupDestination.coordinates) ? pickupDestination : undefined,
        receiverStartLocation: deliveryDestination && Array.isArray(deliveryDestination.coordinates) ? deliveryDestination : undefined,
      });
    } else {
      session.trackingMode = method;
      session.transferMethod = method;
      session.handoverLocation = handoverLocation && Array.isArray(handoverLocation.coordinates) ? handoverLocation : session.handoverLocation;
      session.donorStartLocation = pickupDestination && Array.isArray(pickupDestination.coordinates) ? pickupDestination : session.donorStartLocation;
      session.receiverStartLocation = deliveryDestination && Array.isArray(deliveryDestination.coordinates) ? deliveryDestination : session.receiverStartLocation;
      await session.save();
    }

    if (method === 'PICKUP') {
      await notifyTransferUpdate(req, donation, 'Ready For Pickup', 'Your food is ready for pickup.');
    } else {
      await notifyTransferUpdate(req, donation, 'Delivery Started', 'Your donor is delivering the food.');
    }

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
    
    if (donation.status === 'READY_FOR_PICKUP' && !isReceiver) {
      return res.status(403).json({ message: 'Only the receiver can start pickup for Pickup transfers.' });
    }
    if (donation.status === 'READY_FOR_DELIVERY' && !isDonor) {
      return res.status(403).json({ message: 'Only the donor can start delivery for Delivery transfers.' });
    }

    verifyTransition(donation.status, 'TRACKING');

    donation.status = 'TRACKING';
    await donation.save();
    await syncActiveRequestStatus(moduleType, donation, 'TRACKING');

    await notifyTransferUpdate(req, donation, 'Partner is On The Way', 'The transfer partner has started their journey.');
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Configurable Thresholds
const ARRIVAL_THRESHOLD_METERS = Number(process.env.TRANSFER_ARRIVAL_THRESHOLD_METERS) || PROXIMITY_THRESHOLDS_METERS.handover;

function calculateGeographicDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 2. Mark Arrived
const markArrived = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const { latitude, longitude, accuracy } = req.body;
    
    if (!hasValidCoordinates(latitude, longitude)) {
      return res.status(400).json({ message: 'GPS coordinates are required to verify arrival.' });
    }

    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    
    const { isDonor, isReceiver } = validateParticipant(donation, req.user._id.toString());
    const role = isDonor ? 'DONOR' : 'RECEIVER';
    if (!donation.acceptedReceiver) return res.status(400).json({ message: 'This transfer has no accepted receiver.' });
    if (!['TRACKING', 'APPROACHING', 'ARRIVED'].includes(donation.status)) {
      return res.status(400).json({ message: 'Arrival can only be confirmed during an active transfer.' });
    }
    
    const LocationSessionModel = moduleType === 'food' 
      ? require('../models/FoodLocationSession') 
      : require('../models/ClothLocationSession');

    let session = await LocationSessionModel.findOne({ donation: donationId });
    if (!session) return res.status(400).json({ message: 'Transfer session missing.' });
    if (!['PICKUP', 'DELIVERY'].includes(session.trackingMode)) {
      return res.status(400).json({ message: 'Transfer mode is not set.' });
    }
    const movingRole = session.trackingMode === 'DELIVERY' ? 'DONOR' : 'RECEIVER';

    // Validate distance
    const destCoords = session.handoverLocation?.coordinates;
    if (destCoords && destCoords.length === 2 && hasValidCoordinates(destCoords[1], destCoords[0])) {
      const destLng = destCoords[0];
      const destLat = destCoords[1];
      const distance = calculateDistanceMeters(latitude, longitude, destLat, destLng);
      
      if (distance > ARRIVAL_THRESHOLD_METERS) {
        return res.status(400).json({ message: `You are too far (${Math.round(distance)}m) from the destination to arrive.` });
      }
    } else {
      return res.status(400).json({ message: 'A valid handover location is required to verify arrival.' });
    }

    const arrivedAt = new Date();
    const arrivedField = role === 'DONOR' ? 'donorArrived' : 'receiverArrived';
    const arrivedAtField = role === 'DONOR' ? 'donorArrivedAt' : 'receiverArrivedAt';
    const liveField = role === 'DONOR' ? 'donorLiveLocation' : 'receiverLiveLocation';
    const legacyField = role === 'DONOR' ? 'donorLocation' : 'receiverLocation';
    const arrivalFields = {
      [arrivedField]: true,
      [arrivedAtField]: arrivedAt,
    };
    if (role === movingRole) {
      arrivalFields[legacyField] = {
        lat: Number(latitude),
        lng: Number(longitude),
        accuracy: Number(accuracy) || 0,
        updatedAt: arrivedAt,
      };
      arrivalFields[liveField] = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
        accuracy: Number(accuracy) || 0,
        timestamp: arrivedAt,
      };
      arrivalFields.lastLocationUpdate = arrivedAt;
    }
    const updatedSession = await LocationSessionModel.findOneAndUpdate(
      { donation: donationId, [arrivedField]: { $ne: true } },
      { $set: arrivalFields },
      { new: true }
    );
    if (!updatedSession) {
      session = await LocationSessionModel.findOne({ donation: donationId });
      return res.json({ donation, session, bothArrived: Boolean(session?.donorArrived && session?.receiverArrived) });
    }
    session = updatedSession;
    const bothArrived = Boolean(session.donorArrived && session.receiverArrived);

    if (bothArrived && donation.status !== 'ARRIVED') {
      verifyTransition(donation.status, 'ARRIVED');
      donation.status = 'ARRIVED';
      session = await LocationSessionModel.findOneAndUpdate(
        { donation: donationId, donorArrived: true, receiverArrived: true },
        { $set: { trackingStatus: 'ARRIVED', donorSharing: false, receiverSharing: false } },
        { new: true }
      );
      await donation.save();
      await syncActiveRequestStatus(moduleType, donation, 'ARRIVED');
    }

    const donorId = donation.donor._id?.toString() || donation.donor.toString();
    const receiverId = donation.acceptedReceiver._id?.toString() || donation.acceptedReceiver.toString();
    const io = req.app.get('socketio');
    const selfMessage = role === movingRole
      ? (movingRole === 'DONOR' ? "You have arrived at the receiver's location." : "You have arrived at the donor's pickup location.")
      : 'You have arrived at the handover location.';
    const partnerMessage = role === 'DONOR' ? 'The donor has confirmed arrival.' : 'The receiver has confirmed arrival.';
    const notifications = [
      { recipient: role === 'DONOR' ? donorId : receiverId, title: 'Arrival Update', message: selfMessage },
      { recipient: role === 'DONOR' ? receiverId : donorId, title: 'Partner Arrived', message: partnerMessage },
    ];
    if (bothArrived) {
      notifications.push(
        { recipient: donorId, title: 'Both Arrived', message: 'Both participants have arrived. Handover is ready.' },
        { recipient: receiverId, title: 'Both Arrived', message: 'Both participants have arrived. Handover is ready.' }
      );
    }
    for (const item of notifications) {
      const notification = await Notification.create({
        recipient: item.recipient,
        type: 'TRANSFER_UPDATE',
        title: item.title,
        message: item.message,
        titleCode: item.title,
        messageCode: item.message,
        relatedDonation: donation._id,
      });
      if (io) {
        io.to(`user_${item.recipient}`).emit('notification:new', notification);
        io.to(`user_${item.recipient}`).emit('TRANSFER_UPDATE', { message: item.message });
      }
    }
    if (io) {
      io.to(`transfer:${donationId}`).emit('transfer:arrival-updated', {
        role,
        donorArrived: session.donorArrived,
        receiverArrived: session.receiverArrived,
        bothArrived,
        status: donation.status,
        timestamp: arrivedAt,
      });
      if (bothArrived) {
        io.to(`transfer:${donationId}`).emit('transfer:tracking-stopped', { role: 'DONOR', timestamp: arrivedAt });
        io.to(`transfer:${donationId}`).emit('transfer:tracking-stopped', { role: 'RECEIVER', timestamp: arrivedAt });
      }
    }

    return res.json({ donation, session, bothArrived });
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
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    
    const { isDonor } = validateParticipant(donation, req.user._id.toString());
    
    if (!isDonor) {
      return res.status(403).json({ message: 'Only the donor can initiate handover.' });
    }

    const session = await ensureLocationSession(moduleType, donation);

    const allowedStatuses = ['READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED', 'HANDOVER_READY'];
    if (!allowedStatuses.includes(donation.status)) {
      return res.status(400).json({ message: 'Transfer must be in an active ready/delivery state before handover can be initiated.' });
    }

    verifyTransition(donation.status, 'HANDOVER_READY');

    donation.status = 'HANDOVER_READY';
    session.handoverStatus = 'INITIATED';
    session.donorSharing = false;
    session.receiverSharing = false;
    session.trackingStatus = 'PAUSED';
    sanitizeSessionLiveLocations(session);
    await donation.save();
    await session.save();
    await syncActiveRequestStatus(moduleType, donation, 'HANDOVER_READY');

    const donorId = donation.donor._id?.toString() || donation.donor.toString();
    const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();
    const Notification = require('../models/Notification');
    const io = req.app.get('socketio');
    
    const createNotif = async (recipId, title, message) => {
      const notif = await Notification.create({
        recipient: recipId,
        type: 'TRANSFER_UPDATE',
        title,
        message,
        titleCode: title,
        messageCode: message,
        relatedDonation: donation._id
      });
      if (io) {
        io.to(`user_${recipId}`).emit('notification:new', notif);
        io.to(`user_${recipId}`).emit('TRANSFER_UPDATE', { message });
      }
    };

    await createNotif(donorId, "Handover Started", "You have started the handover.");
    await createNotif(receiverId, "Handover Started", "The donor has started the handover. You can now verify the QR code.");

    if (io) {
      io.to(`transfer:${donationId}`).emit('transfer:handover-started', { status: donation.status });
      io.to(`transfer:${donationId}`).emit('transfer:tracking-stopped', { role: 'DONOR', timestamp: new Date() });
      io.to(`transfer:${donationId}`).emit('transfer:tracking-stopped', { role: 'RECEIVER', timestamp: new Date() });
    }

    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Complete Transfer
const completeTransfer = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const userId = req.user._id.toString();
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    const { isReceiver } = validateParticipant(donation, userId);
    if (!isReceiver) return res.status(403).json({ message: 'Only the receiver can confirm receipt.' });
    if (donation.status !== 'QR_VERIFIED' || !donation.handoverVerified) {
      return res.status(400).json({ message: 'Verify the transfer QR before confirming receipt.' });
    }
    verifyTransition(donation.status, 'COMPLETED');

    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: { $in: ACTIVE_TRANSFER_REQUEST_STATUSES }
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

    await donation.save();

    const LocationSessionModel = moduleType === 'food'
      ? require('../models/FoodLocationSession')
      : require('../models/ClothLocationSession');
    const session = await LocationSessionModel.findOne({ donation: donationId });
    if (session) {
      session.donorSharing = false;
      session.receiverSharing = false;
      session.trackingStatus = 'COMPLETED';
      session.completedAt = new Date();
      session.endedAt = session.completedAt;
      await session.save();
    }

    await notifyBothParticipants(req, donation, 'Transfer Completed', `Transfer was marked complete.`);
    const io = req.app.get('socketio');
    if (io) {
      io.to(`transfer:${donationId}`).emit('transfer:completed', { donationId, status: donation.status });
      io.in(`transfer:${donationId}`).socketsLeave(`transfer:${donationId}`);
    }
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

    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: { $in: ACTIVE_TRANSFER_REQUEST_STATUSES }
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
    
    if (donation.donor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the donor can generate the handover token' });
    }

    const io = req.app.get('socketio');
    if (donation.expiryTime && new Date(donation.expiryTime) < new Date()) {
      await processAutomaticExpiry(donation, moduleType, io);
      return res.status(400).json({ message: 'This donation has expired and cannot be collected.' });
    }
    
    if (donation.status !== 'HANDOVER_READY') {
      return res.status(400).json({ message: 'Transfer is not in HANDOVER_READY state' });
    }

    const token = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60000);

    donation.handoverToken = token;
    donation.handoverTokenExpiry = expiry;
    await donation.save();

    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: { $in: ACTIVE_TRANSFER_REQUEST_STATUSES }
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
    let { token } = req.body;
    const userId = req.user._id.toString();

    if (!token) return res.status(400).json({ message: 'Token is required' });

    if (typeof token === 'string' && token.trim().startsWith('{')) {
      try {
        token = JSON.parse(token);
      } catch {
        return res.status(400).json({ message: 'Invalid QR payload.' });
      }
    }

    const Model = getModel(moduleType);
    let donation = await Model.findById(donationId).select('+handoverToken +handoverTokenExpiry +handoverVerified +expiryTime');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    validateParticipant(donation, userId);

    if (donation.acceptedReceiver.toString() !== userId) {
      return res.status(403).json({ message: 'Only the receiver can verify the handover token' });
    }

    if (typeof token === 'object') {
      const validPayload = token.purpose === 'HungerLink_Handover_Verification'
        && token.donationId === donation._id.toString()
        && token.donorId === donation.donor.toString()
        && token.receiverId === donation.acceptedReceiver.toString();
      if (!validPayload) return res.status(400).json({ message: 'QR code does not belong to this transfer.' });
      token = token.token;
    }
    if (typeof token !== 'string' || !/^\d{6}$/.test(token)) {
      return res.status(400).json({ message: 'A valid six-digit handover code is required.' });
    }

    if (donation.status !== 'HANDOVER_READY') {
      return res.status(400).json({ message: 'Transfer is not in HANDOVER_READY state' });
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

    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
    const activeRequest = await RequestModel.findOne({
      donation: donation._id,
      receiver: donation.acceptedReceiver,
      status: { $in: ACTIVE_TRANSFER_REQUEST_STATUSES }
    });
    
    if (!activeRequest) {
      return res.status(400).json({ message: 'No active accepted request found for this transfer.' });
    }

    verifyTransition(donation.status, 'QR_VERIFIED');

    donation.status = 'QR_VERIFIED';
    donation.handoverVerified = true;
    donation.handoverToken = null;
    donation.handoverTokenExpiry = null;
    await donation.save();
    await syncActiveRequestStatus(moduleType, donation, 'QR_VERIFIED');

    const LocationSessionModel = moduleType === 'food'
      ? require('../models/FoodLocationSession')
      : require('../models/ClothLocationSession');
    await LocationSessionModel.findOneAndUpdate(
      { donation: donationId },
      { $set: { handoverStatus: 'VERIFIED', qrVerificationStatus: 'VERIFIED' } }
    );

    await notifyBothParticipants(req, donation, 'Handover Verified', 'The handover token was verified successfully.');

    res.json({ message: 'Handover verified securely', donation });
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

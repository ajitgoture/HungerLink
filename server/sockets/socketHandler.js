const jwt = require('jsonwebtoken');
const FoodLocationSession = require('../models/FoodLocationSession');
const ClothLocationSession = require('../models/ClothLocationSession');
const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const {
  PROXIMITY_THRESHOLDS_METERS,
  hasValidCoordinates,
  calculateDistanceMeters,
  getMovingRole,
} = require('../utils/transferLocation');

const ACTIVE_TRANSFER_STATES = new Set(['TRACKING', 'APPROACHING']);

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log('[Socket Connected]:', socket.id);

    socket.on('JOIN_USER_ROOM', async (data) => {
      try {
        const decoded = jwt.verify(data?.token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const authenticatedUserId = decoded.id.toString();
        if (!data.userId || data.userId.toString() !== authenticatedUserId) {
          return socket.emit('user:access_denied', { message: 'You can only join your own notification room.' });
        }
        socket.userId = authenticatedUserId;
        socket.join(`user_${authenticatedUserId}`);
        socket.emit('user:room_joined');
      } catch {
        socket.emit('user:access_denied', { message: 'Authentication is required for notifications.' });
      }
    });

    socket.on('JOIN_ROLE_ROOM', async (data) => {
      try {
        const decoded = jwt.verify(data?.token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const user = await User.findById(decoded.id).select('role');
        if (!user || !data.role || user.role.toLowerCase() !== data.role.toLowerCase()) {
          return socket.emit('user:access_denied', { message: 'You can only join your own role notification room.' });
        }
        socket.join(`role_${user.role}`);
      } catch {
        socket.emit('user:access_denied', { message: 'Authentication is required for role notifications.' });
      }
    });

    // ==========================================
    // PHASE 5: UNIFIED TRANSFER TRACKING SYSTEM
    // ==========================================

    socket.on('JOIN_TRANSFER_ROOM', async (data) => {
      try {
        const { transferId, token, moduleType } = data; // moduleType = 'food' or 'cloth'
        if (!token || !['food', 'cloth'].includes(moduleType) || !transferId) {
          return socket.emit('transfer:error', { message: 'Authentication and a valid transfer are required.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const userId = decoded.id;

        const SessionModel = moduleType === 'cloth' ? ClothLocationSession : FoodLocationSession;
        const session = await SessionModel.findOne({ donation: transferId });
        if (!session) return socket.emit('transfer:error', { message: 'Transfer session not found.' });

        const DonationModel = moduleType === 'cloth' ? ClothDonation : FoodDonation;
        const donation = await DonationModel.findById(transferId);
        if (!donation) return socket.emit('transfer:error', { message: 'Donation not found.' });

        if (!['READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED', 'HANDOVER_READY', 'QR_VERIFIED'].includes(donation.status)) {
          return socket.emit('transfer:error', { message: 'This transfer is not available for tracking.' });
        }

        // Authenticate Role
        const isDonor = donation.donor.toString() === userId.toString();
        const isReceiver = donation.acceptedReceiver && donation.acceptedReceiver.toString() === userId.toString();

        if (!isDonor && !isReceiver) {
          console.warn('[Socket Security]: Unauthorized join attempt to transfer:', transferId);
          return socket.emit('transfer:access_denied', { message: 'Access denied to this private transfer.' });
        }

        const sessionDonorId = session.donor.toString();
        const sessionReceiverId = session.receiver.toString();
        if (sessionDonorId !== donation.donor.toString()
          || sessionReceiverId !== donation.acceptedReceiver?.toString()) {
          return socket.emit('transfer:access_denied', { message: 'Transfer session participants do not match.' });
        }

        const role = isDonor ? 'DONOR' : 'RECEIVER';
        if (socket.transferId && socket.transferId !== transferId) {
          socket.leave(`transfer:${socket.transferId}`);
        }
        socket.transferId = transferId;
        socket.transferRole = role;
        socket.transferUserId = userId;
        socket.moduleType = moduleType;

        const roomName = `transfer:${transferId}`;
        socket.join(roomName);

        socket.emit('transfer:room_joined', { roomName, role });

        // Push current sync state on connect (Reconnection mechanism)
        socket.emit('transfer:sync', {
            trackingMode: session.trackingMode,
            status: donation.status,
            donorSharing: session.donorSharing,
            receiverSharing: session.receiverSharing,
            donorLiveLocation: session.donorLiveLocation,
            receiverLiveLocation: session.receiverLiveLocation,
            handoverLocation: session.handoverLocation,
            donorArrived: session.donorArrived,
            receiverArrived: session.receiverArrived,
            proximityMilestones: session.proximityMilestones,
        });
      } catch (err) {
        socket.emit('transfer:access_denied', { message: 'Invalid token or session error.' });
      }
    });

    socket.on('transfer:tracking-started', async (data) => {
      if (!socket.transferId || !socket.transferRole) return;
      const roomName = `transfer:${socket.transferId}`;
      
      const SessionModel = socket.moduleType === 'cloth' ? ClothLocationSession : FoodLocationSession;
      const DonationModel = socket.moduleType === 'cloth' ? ClothDonation : FoodDonation;
      const sharingField = socket.transferRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';
      const donation = await DonationModel.findById(socket.transferId);
      const session = await SessionModel.findOne({ donation: socket.transferId });
      if (!donation || !ACTIVE_TRANSFER_STATES.has(donation.status)) {
        return socket.emit('transfer:location-error', { message: 'Live tracking is not active for this transfer.' });
      }
      if (!session || socket.transferRole !== getMovingRole(session.trackingMode)) {
        return socket.emit('transfer:location-error', { message: 'Only the moving participant can share live location.' });
      }
      await SessionModel.findOneAndUpdate(
        { donation: socket.transferId },
        { $set: { [sharingField]: true, trackingStatus: 'ACTIVE' } }
      );
      socket.isSharingLive = true;

      io.to(roomName).emit('transfer:tracking-started', {
        userId: socket.transferUserId,
        role: socket.transferRole,
        timestamp: new Date()
      });
    });

    socket.on('transfer:location-update', async (data) => {
      if (!socket.transferId || !socket.transferRole) return;
      try {
        const latitude = Number(data?.latitude ?? data?.lat);
        const longitude = Number(data?.longitude ?? data?.lng);
        const accuracy = Number(data?.accuracy);
        const positionTimestamp = new Date(data?.timestamp);
        const now = new Date();
        if (!hasValidCoordinates(latitude, longitude)
          || !Number.isFinite(accuracy) || accuracy < 0
          || Number.isNaN(positionTimestamp.getTime())
          || positionTimestamp.getTime() > now.getTime() + 5000
          || now.getTime() - positionTimestamp.getTime() > 120000) {
          return socket.emit('transfer:location-error', { message: 'A fresh, valid GPS position is required.' });
        }

        const DonationModel = socket.moduleType === 'cloth' ? ClothDonation : FoodDonation;
        const SessionModel = socket.moduleType === 'cloth' ? ClothLocationSession : FoodLocationSession;
        const donation = await DonationModel.findById(socket.transferId);
        if (!donation || !ACTIVE_TRANSFER_STATES.has(donation.status)) {
          return socket.emit('transfer:location-error', { message: 'Live tracking is not active for this transfer.' });
        }
        const isCurrentParticipant = socket.transferRole === 'DONOR'
          ? donation.donor.toString() === socket.transferUserId.toString()
          : donation.acceptedReceiver?.toString() === socket.transferUserId.toString();
        if (!isCurrentParticipant) {
          socket.leave(`transfer:${socket.transferId}`);
          socket.transferId = null;
          return socket.emit('transfer:access_denied', { message: 'You are no longer a participant in this transfer.' });
        }

        const currentSession = await SessionModel.findOne({ donation: socket.transferId });
        if (!currentSession || socket.transferRole !== getMovingRole(currentSession.trackingMode)) {
          return socket.emit('transfer:location-error', { message: 'Only the moving participant can share live location.' });
        }

        const updateField = socket.transferRole === 'DONOR' ? 'donorLocation' : 'receiverLocation';
        const geoField = socket.transferRole === 'DONOR' ? 'donorLiveLocation' : 'receiverLiveLocation';
        const sharingField = socket.transferRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';
        const geoPoint = { type: 'Point', coordinates: [Number(longitude), Number(latitude)] };

        const updatePayload = {
          [sharingField]: true,
          [updateField]: { lat: latitude, lng: longitude, heading: Number(data.heading) || 0, accuracy, updatedAt: positionTimestamp },
          lastLocationUpdate: positionTimestamp,
        };
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          updatePayload[geoField] = geoPoint;
        }

        const session = await SessionModel.findOneAndUpdate(
          { donation: socket.transferId },
          { $set: updatePayload },
          { new: true }
        );
        if (!session) return socket.emit('transfer:error', { message: 'Transfer session not found.' });

        if (socket.transferRole === getMovingRole(session.trackingMode)
          && donation.status === 'TRACKING'
          && session.handoverLocation?.coordinates?.length === 2) {
          const [destinationLongitude, destinationLatitude] = session.handoverLocation.coordinates;
          const distance = calculateDistanceMeters(latitude, longitude, destinationLatitude, destinationLongitude);
          if (distance !== null && distance <= PROXIMITY_THRESHOLDS_METERS.approaching) {
            donation.status = 'APPROACHING';
            session.trackingStatus = 'ACTIVE';
            await donation.save();
            io.to(`transfer:${socket.transferId}`).emit('transfer:status-updated', { status: donation.status });
          }
        }

        if (socket.transferRole === getMovingRole(session.trackingMode)
          && session.handoverLocation?.coordinates?.length === 2) {
          const [destinationLongitude, destinationLatitude] = session.handoverLocation.coordinates;
          const distance = calculateDistanceMeters(latitude, longitude, destinationLatitude, destinationLongitude);
          const reachedMilestones = [];
          if (distance <= PROXIMITY_THRESHOLDS_METERS.approaching) reachedMilestones.push('APPROACHING');
          if (distance <= PROXIMITY_THRESHOLDS_METERS.handover) reachedMilestones.push('AT_LOCATION');

          for (const milestoneKey of reachedMilestones) {
            const claimed = await SessionModel.findOneAndUpdate(
              { donation: socket.transferId, proximityMilestones: { $ne: milestoneKey } },
              { $addToSet: { proximityMilestones: milestoneKey } },
              { new: true }
            );
            if (!claimed) continue;

            const isDelivery = session.trackingMode === 'DELIVERY';
            const selfMessage = milestoneKey === 'APPROACHING'
              ? (isDelivery ? "You are approaching the receiver's location." : "You are approaching the donor's pickup location.")
              : (isDelivery ? "You are at the receiver's location." : "You are at the donor's pickup location.");
            const partnerMessage = milestoneKey === 'APPROACHING'
              ? (isDelivery ? 'The donor is near your location.' : 'The receiver is near your pickup location.')
              : (isDelivery ? 'The donor is at your location.' : 'The receiver is at your pickup location.');
            const movingUserId = socket.transferUserId.toString();
            const stationaryUserId = socket.transferRole === 'DONOR' ? session.receiver.toString() : session.donor.toString();
            for (const notificationData of [
              { recipient: movingUserId, message: selfMessage },
              { recipient: stationaryUserId, message: partnerMessage },
            ]) {
              const notification = await require('../models/Notification').create({
                recipient: notificationData.recipient,
                type: 'TRANSFER_UPDATE',
                title: milestoneKey === 'APPROACHING' ? 'Approaching' : 'At Location',
                message: notificationData.message,
                titleCode: milestoneKey === 'APPROACHING' ? 'Approaching' : 'At Location',
                messageCode: notificationData.message,
                messageParams: { mode: session.trackingMode, role: socket.transferRole },
                relatedDonation: socket.transferId,
              });
              io.to(`user_${notificationData.recipient}`).emit('notification:new', notification);
            }
          }
        }

        socket.isSharingLive = true;
        io.to(`transfer:${socket.transferId}`).emit('transfer:location-update', {
          transferId: socket.transferId,
          userId: socket.transferUserId,
          role: socket.transferRole,
          latitude,
          longitude,
          accuracy,
          speed: Number(data.speed) || 0,
          heading: Number(data.heading) || 0,
          timestamp: positionTimestamp,
        });
      } catch (error) {
        console.error('[Socket Location Update Error]:', error.message);
        socket.emit('transfer:error', { message: 'Unable to process this location update.' });
      }
    });

    socket.on('transfer:stop_tracking', async () => {
      if (socket.transferId && socket.transferRole) {
        const roomName = `transfer:${socket.transferId}`;
        const sharingField = socket.transferRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';
        const SessionModel = socket.moduleType === 'cloth' ? ClothLocationSession : FoodLocationSession;

        await SessionModel.findOneAndUpdate({ donation: socket.transferId }, { $set: { [sharingField]: false } });
        socket.isSharingLive = false;

        io.to(roomName).emit('transfer:tracking-stopped', {
          userId: socket.transferUserId,
          role: socket.transferRole,
          timestamp: new Date(),
        });
      }
    });

    // ==========================================
    // CHAT SYSTEM (PHASE 8)
    // ==========================================
    const rateLimitMap = new Map();

    socket.on('JOIN_CHAT_ROOM', async (data) => {
      try {
        const { conversationId, token } = data;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const userId = decoded.id.toString();
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit('chat:error', { message: 'Conversation not found.' });
        
        if (conv.donorId.toString() !== userId && conv.receiverId.toString() !== userId) {
          return socket.emit('chat:error', { message: 'Unauthorized chat access.' });
        }
        
        const roomName = `chat_${conversationId}`;
        socket.join(roomName);
        socket.emit('chat:room_joined', { roomName });
      } catch (err) {
        socket.emit('chat:error', { message: 'Failed to join chat. Invalid token.' });
      }
    });

    socket.on('chat:message', async (data) => {
      try {
        const { conversationId, text, token, senderId } = data;
        if (!text || text.length > 1000) return;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const userId = decoded.id.toString();
        if (userId !== senderId) return;

        const conv = await Conversation.findById(conversationId);
        if (!conv || (conv.donorId.toString() !== userId && conv.receiverId.toString() !== userId)) {
          return socket.emit('chat:error', { message: 'Unauthorized message attempt.' });
        }

        const now = Date.now();
        const lastMsgTime = rateLimitMap.get(userId) || 0;
        if (now - lastMsgTime < 500) {
          return socket.emit('chat:error', { message: 'You are sending messages too quickly.' });
        }
        rateLimitMap.set(userId, now);
        
        const newMsg = await Message.create({ conversationId, senderId: userId, text, isSystem: false });
        await Conversation.findByIdAndUpdate(conversationId, { lastMessageAt: new Date(), lastMessageText: text });
        io.to(`chat_${conversationId}`).emit('chat:message_received', newMsg);
      } catch (err) {}
    });

    socket.on('chat:typing', async (data) => {
      try {
        const { conversationId, isTyping, senderId, token } = data;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        if (decoded.id.toString() !== senderId) return;
        socket.to(`chat_${conversationId}`).emit('chat:typing_update', { senderId, isTyping });
      } catch (err) {}
    });

    socket.on('disconnect', async () => {
      try {
        if (socket.isSharingLive && socket.transferId && socket.transferRole) {
          const sharingField = socket.transferRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';
          const SessionModel = socket.moduleType === 'cloth' ? ClothLocationSession : FoodLocationSession;
          await SessionModel.findOneAndUpdate({ donation: socket.transferId }, { $set: { [sharingField]: false } });
          io.to(`transfer:${socket.transferId}`).emit('transfer:tracking-stopped', {
            userId: socket.transferUserId,
            role: socket.transferRole,
            timestamp: new Date()
          });
        }
      } catch (err) {}
      console.log(`[Socket Disconnected]: ${socket.id}`);
    });
  });
};

module.exports = setupSocketIO;

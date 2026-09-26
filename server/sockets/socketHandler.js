const jwt = require('jsonwebtoken');
const FoodDonation = require('../models/FoodDonation');
const FoodLocationSession = require('../models/FoodLocationSession');
const ClothDonation = require('../models/ClothDonation');
const ClothLocationSession = require('../models/ClothLocationSession');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket Connected]: ${socket.id}`);

    // Join User Room (Secure)
    socket.on('JOIN_USER_ROOM', (data) => {
      try {
        const payload = typeof data === 'string' ? { userId: data } : data;
        const { userId, token } = payload;
        
        if (!token) throw new Error('No token provided');
        if (!userId) throw new Error('No userId provided');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        
        // Strict Security: Users can only join their OWN room!
        if (decoded.id.toString() !== userId.toString()) {
          throw new Error('Unauthorized room join attempt');
        }
        
        socket.join(`user_${userId}`);
        socket.userId = userId;
        console.log(`[Socket]: User ${userId} authenticated and joined room user_${userId}`);
      } catch (err) {
        console.error('[Socket Auth Error]:', err.message);
      }
    });

    // Join Role Room
    socket.on('JOIN_ROLE_ROOM', (data) => {
      try {
        const payload = typeof data === 'string' ? { role: data } : data;
        const { role, token } = payload;
        
        if (!token) throw new Error('No token provided');
        if (!role) throw new Error('No role provided');
        
        jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        
        socket.join(`role_${role.toLowerCase().replace(/\s+/g, '_')}`);
        socket.userRole = role;
        console.log(`[Socket]: Joined role room: role_${role.toLowerCase().replace(/\s+/g, '_')}`);
      } catch (err) {
        console.error('[Socket Role Auth Error]:', err.message);
      }
    });

    // ==========================================
    // FOOD LOCATION ROOM SECURITY
    // ==========================================
    socket.on('JOIN_LOCATION_ROOM', async (data) => {
      try {
        const { donationId, token } = data || {};
        if (!donationId || !token) {
          return socket.emit('location:access_denied', { message: 'ACCESS DENIED: Token required.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const donation = await FoodDonation.findById(donationId);
        if (!donation) return socket.emit('location:access_denied', { message: 'Donation not found.' });

        const invalidStatuses = ['AVAILABLE', 'REQUESTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
        if (invalidStatuses.includes(donation.status)) {
          return socket.emit('location:access_denied', { message: 'Location sharing is not available for this donation status.' });
        }

        const userId = decoded.id.toString();
        const donorId = donation.donor.toString();
        const acceptedReceiverId = donation.acceptedReceiver ? donation.acceptedReceiver.toString() : null;

        if (userId !== donorId && userId !== acceptedReceiverId) {
          return socket.emit('location:access_denied', { message: 'ACCESS DENIED: Unauthorized to view location.' });
        }

        const roomName = `food-donation-location-${donationId}`;
        socket.join(roomName);
        socket.userId = userId;
        socket.userRole = userId === donorId ? 'DONOR' : 'RECEIVER';
        socket.donationId = donationId;
        socket.emit('location:room_joined', { roomName, role: socket.userRole });
      } catch (err) {
        socket.emit('location:access_denied', { message: 'ACCESS DENIED: Invalid token.' });
      }
    });

    socket.on('location:start_share', (data) => {
      if (socket.donationId) {
        io.to(`food-donation-location-${socket.donationId}`).emit('location:share_started', {
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date(),
        });
      }
    });

    socket.on('location:update', async (data) => {
      try {
        const { donationId, lat, lng, heading, accuracy } = data || {};
        if (!socket.donationId || socket.donationId !== donationId) return;

        const roomName = `food-donation-location-${donationId}`;
        const now = new Date();
        const updateField = socket.userRole === 'DONOR' ? 'donorLocation' : 'receiverLocation';
        const sharingField = socket.userRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';

        await FoodLocationSession.findOneAndUpdate(
          { donation: donationId },
          {
            $set: {
              [sharingField]: true,
              [updateField]: { lat, lng, heading: heading || 0, accuracy: accuracy || 0, updatedAt: now },
              lastUpdatedAt: now,
            },
          },
          { upsert: true }
        );

        io.to(roomName).emit('location:update_received', {
          userId: socket.userId,
          role: socket.userRole,
          lat,
          lng,
          heading: heading || 0,
          accuracy: accuracy || 0,
          updatedAt: now,
        });
      } catch (err) {
        console.error('Error handling location update socket:', err);
      }
    });

    socket.on('location:stop_share', async (data) => {
      if (socket.donationId) {
        const roomName = `food-donation-location-${socket.donationId}`;
        const sharingField = socket.userRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';

        await FoodLocationSession.findOneAndUpdate(
          { donation: socket.donationId },
          { $set: { [sharingField]: false } }
        );

        io.to(roomName).emit('location:share_stopped', {
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date(),
        });
      }
    });

    // ==========================================
    // CLOTHES LOCATION ROOM SECURITY
    // ==========================================
    socket.on('JOIN_CLOTH_LOCATION_ROOM', async (data) => {
      try {
        const { donationId, token } = data || {};
        if (!donationId || !token) {
          return socket.emit('cloth:location:access_denied', { message: 'ACCESS DENIED: Authentication token and donation ID required.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        const donation = await ClothDonation.findById(donationId);
        if (!donation) return socket.emit('cloth:location:access_denied', { message: 'Donation not found.' });

        const invalidStatuses = ['AVAILABLE', 'REQUESTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
        if (invalidStatuses.includes(donation.status)) {
          return socket.emit('cloth:location:access_denied', { message: 'Location sharing is not available for this donation status.' });
        }

        const userId = decoded.id.toString();
        const donorId = donation.donor.toString();
        const acceptedReceiverId = donation.acceptedReceiver ? donation.acceptedReceiver.toString() : null;

        // STRICT AUTHORIZATION: Donor or Accepted Receiver ONLY!
        if (userId !== donorId && userId !== acceptedReceiverId) {
          console.warn(`[Socket Security Alert]: Unauthorized user ${userId} attempted to join clothes location room ${donationId}`);
          return socket.emit('cloth:location:access_denied', { message: 'ACCESS DENIED: You are not authorized to view live location for this clothes donation.' });
        }

        const roomName = `cloth-donation-location-${donationId}`;
        socket.join(roomName);
        socket.clothUserId = userId;
        socket.clothUserRole = userId === donorId ? 'DONOR' : 'RECEIVER';
        socket.clothDonationId = donationId;

        console.log(`[Socket Cloth Location]: User ${userId} (${socket.clothUserRole}) joined room ${roomName}`);
        socket.emit('cloth:location:room_joined', { roomName, role: socket.clothUserRole });
      } catch (err) {
        console.error('[Cloth Socket Location Auth Error]:', err.message);
        socket.emit('cloth:location:access_denied', { message: 'ACCESS DENIED: Invalid token.' });
      }
    });

    socket.on('cloth:location:start_share', (data) => {
      if (socket.clothDonationId) {
        const roomName = `cloth-donation-location-${socket.clothDonationId}`;
        io.to(roomName).emit('cloth:location:share_started', {
          userId: socket.clothUserId,
          role: socket.clothUserRole,
          timestamp: new Date(),
        });
      }
    });

    socket.on('cloth:location:update', async (data) => {
      try {
        const { donationId, lat, lng, heading, accuracy } = data || {};
        if (!socket.clothDonationId || socket.clothDonationId !== donationId) return;

        const roomName = `cloth-donation-location-${donationId}`;
        const now = new Date();

        const updateField = socket.clothUserRole === 'DONOR' ? 'donorLocation' : 'receiverLocation';
        const sharingField = socket.clothUserRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';

        await ClothLocationSession.findOneAndUpdate(
          { donation: donationId },
          {
            $set: {
              [sharingField]: true,
              [updateField]: { lat, lng, heading: heading || 0, accuracy: accuracy || 0, updatedAt: now },
              lastUpdatedAt: now,
            },
          },
          { upsert: true }
        );

        io.to(roomName).emit('cloth:location:update_received', {
          userId: socket.clothUserId,
          role: socket.clothUserRole,
          lat,
          lng,
          heading: heading || 0,
          accuracy: accuracy || 0,
          updatedAt: now,
        });
      } catch (err) {
        console.error('Error handling cloth location update socket:', err);
      }
    });

    socket.on('cloth:location:stop_share', async (data) => {
      if (socket.clothDonationId) {
        const roomName = `cloth-donation-location-${socket.clothDonationId}`;
        const sharingField = socket.clothUserRole === 'DONOR' ? 'donorSharing' : 'receiverSharing';

        await ClothLocationSession.findOneAndUpdate(
          { donation: socket.clothDonationId },
          { $set: { [sharingField]: false } }
        );

        io.to(roomName).emit('cloth:location:share_stopped', {
          userId: socket.clothUserId,
          role: socket.clothUserRole,
          timestamp: new Date(),
        });
      }
    });

    // ==========================================
    // CHAT SYSTEM (PHASE 8)
    // ==========================================
    
    // Rate limiter map to prevent spam
    const rateLimitMap = new Map();

    socket.on('JOIN_CHAT_ROOM', async (data) => {
      try {
        const { conversationId, token } = data;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        
        const userId = decoded.id.toString();
        const Conversation = require('../models/Conversation');
        const conv = await Conversation.findById(conversationId);
        
        if (!conv) {
          return socket.emit('chat:error', { message: 'Conversation not found.' });
        }
        
        if (conv.donorId.toString() !== userId && conv.receiverId.toString() !== userId) {
          console.warn(`[Socket Security Alert]: User ${userId} attempted unauthorized chat access.`);
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

        const Conversation = require('../models/Conversation');
        const conv = await Conversation.findById(conversationId);
        if (!conv || (conv.donorId.toString() !== userId && conv.receiverId.toString() !== userId)) {
          return socket.emit('chat:error', { message: 'Unauthorized message attempt.' });
        }

        // Rate limiting: 1 message per 500ms
        const now = Date.now();
        const lastMsgTime = rateLimitMap.get(userId) || 0;
        if (now - lastMsgTime < 500) {
          return socket.emit('chat:error', { message: 'You are sending messages too quickly.' });
        }
        rateLimitMap.set(userId, now);

        const Message = require('../models/Message');
        
        const newMsg = await Message.create({
          conversationId,
          senderId: userId,
          text,
          isSystem: false,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessageAt: new Date(),
          lastMessageText: text
        });

        // Broadcast to room
        io.to(`chat_${conversationId}`).emit('chat:message_received', newMsg);
      } catch (err) {
        console.error('Chat error:', err.message);
      }
    });

    socket.on('chat:typing', async (data) => {
      try {
        const { conversationId, isTyping, senderId, token } = data;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026');
        if (decoded.id.toString() !== senderId) return;

        socket.to(`chat_${conversationId}`).emit('chat:typing_update', { senderId, isTyping });
      } catch (err) {
        // Ignore typing errors silently
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected]: ${socket.id}`);
    });
  });
};

module.exports = setupSocketIO;

const { io } = require('socket.io-client');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const FoodRequest = require('./models/FoodRequest');

const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const req = await FoodRequest.findOne({ status: 'ACCEPTED' }).populate('donation');
  if (!req) {
    console.log('No accepted requests found');
    process.exit();
  }

  const receiver = await User.findById(req.receiver);
  const token = jwt.sign({ id: receiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const socket = io('http://localhost:5000');
  
  socket.on('connect', () => {
    console.log('Socket connected. Joining room for donation:', req.donation._id);
    socket.emit('JOIN_LOCATION_ROOM', { donationId: req.donation._id, token });
  });

  socket.on('location:room_joined', (data) => {
    console.log('ROOM JOINED:', data);
    process.exit();
  });

  socket.on('location:access_denied', (data) => {
    console.log('ACCESS DENIED:', data);
    process.exit();
  });

  setTimeout(() => {
    console.log('Timeout - no response');
    process.exit();
  }, 5000);
};

run();

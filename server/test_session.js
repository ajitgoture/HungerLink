const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const FoodRequest = require('./models/FoodRequest');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
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

  console.log(`Donation ID: ${req.donation._id}`);
  console.log(`Receiver ID: ${receiver._id}`);
  console.log(`Accepted Receiver ID: ${req.donation.acceptedReceiver}`);

  const res = await fetch(`${BASE_URL}/food/location/session/${req.donation._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log(`HTTP Status: ${res.status}`);
  const data = await res.json();
  console.log('Response:', data);

  process.exit();
};
run();

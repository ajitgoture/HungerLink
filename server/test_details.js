const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const donor = await User.findOne({ role: 'Food Donor' });
  const receiver = await User.findOne({ role: 'Food Receiver' });

  const donorToken = jwt.sign({ id: donor._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const receiverToken = jwt.sign({ id: receiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const apiCall = async (endpoint, method, token, body = null) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : null
    });
    let text = '';
    try { text = await res.text(); text = JSON.parse(text); } catch(e){}
    return { status: res.status, data: text };
  };

  try {
    console.log('--- TESTING FOOD DETAILS FLOW ---');
    const now = new Date();
    const foodPayload = {
      foodItems: JSON.stringify([{ foodName: 'View Details Test', quantity: 1, peopleServed: 1, preparationTime: new Date(now.getTime() - 3600000).toISOString(), expiryTime: new Date(now.getTime() + 86400000).toISOString() }]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: donor.city, pickupAddress: 'Base 2', lat: 15.85, lng: 74.5, contactNumber: '9988776655', safetyAcknowledged: true
    };
    
    // 1. Post a donation
    const cPost = await apiCall(`/food/donations`, 'POST', donorToken, foodPayload);
    const donationId = cPost.data._id.toString();
    console.log('Created Donation ID:', donationId);

    // 2. Fetch by ID
    const fetchRes = await apiCall(`/food/donations/${donationId}`, 'GET', receiverToken);
    if (fetchRes.status === 200 && fetchRes.data._id === donationId) {
      console.log('Food Donation A -> View Details -> A opens: PASS');
    } else {
      console.error('Failed to fetch details', fetchRes);
    }

    // 3. Fetch invalid ID
    const fetchFail = await apiCall(`/food/donations/000000000000000000000000`, 'GET', receiverToken);
    if (fetchFail.status === 404) {
      console.log('Invalid ID -> "Donation not found": PASS');
    } else {
      console.error('Failed Invalid ID test', fetchFail);
    }

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
};
runTests();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const donor = await User.findOne({ role: 'Cloth Donor' });
  const donorToken = jwt.sign({ id: donor._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

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
    const now = new Date();
    const clothPayload = {
      items: JSON.stringify([
        { recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 3, condition: 'Good' }
      ]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: donor.city, pickupAddress: 'Base 3', lat: 15.85, lng: 74.5, contactNumber: '9988776655', qualityAcknowledged: true
    };
    
    const cPost = await apiCall(`/cloth/donations`, 'POST', donorToken, clothPayload);
    console.log(cPost);

  } catch(e) {} finally { process.exit(); }
};
runTests();

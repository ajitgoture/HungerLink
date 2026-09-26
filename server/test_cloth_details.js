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
  const receiver = await User.findOne({ role: 'Cloth Receiver' });

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
    const now = new Date();
    const clothPayload = {
      items: JSON.stringify([
        { recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 3, condition: 'Good' },
        { recipientCategory: 'Women', type: 'Dress', size: 'L', quantity: 2, condition: 'Like New' },
        { recipientCategory: 'Children', type: 'T-Shirt', size: '8-10 Years', quantity: 5, condition: 'Fair' }
      ]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: donor.city, pickupAddress: 'Base 3', lat: 15.85, lng: 74.5, contactNumber: '9988776655', qualityAcknowledged: true
    };
    
    const cPost = await apiCall(`/cloth/donations`, 'POST', donorToken, clothPayload);
    if (cPost.status !== 201) {
      console.log('Failed to post clothes:', cPost);
      process.exit();
    }
    const donationId = cPost.data._id.toString();
    
    const fetchRes = await apiCall(`/cloth/donations/${donationId}`, 'GET', receiverToken);
    if (fetchRes.status === 200 && fetchRes.data._id === donationId && fetchRes.data.items.length === 3) {
      console.log('Cloth Donation A -> View Details -> A opens (Multiple items preserved): PASS');
    } else {
      console.error('Failed to fetch details', fetchRes);
    }

    const fetchFail = await apiCall(`/cloth/donations/000000000000000000000000`, 'GET', receiverToken);
    if (fetchFail.status === 404) {
      console.log('Invalid ID -> "Clothes donation not found": PASS');
    } else {
      console.error('Failed Invalid ID test', fetchFail);
    }

  } catch(e) { console.error(e); } finally { process.exit(); }
};
runTests();

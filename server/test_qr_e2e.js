const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const ClothDonation = require('./models/ClothDonation');
const FoodRequest = require('./models/FoodRequest');
const ClothRequest = require('./models/ClothRequest');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const donor = await User.findOne({ role: 'Food Donor' });
  const receiver = await User.findOne({ role: 'Food Receiver' });
  const otherReceiver = await User.findOne({ role: 'Food Receiver', _id: { $ne: receiver._id } });

  const cDonor = await User.findOne({ role: 'Cloth Donor' });
  const cReceiver = await User.findOne({ role: 'Cloth Receiver' });

  if (!donor || !receiver || !otherReceiver || !cDonor || !cReceiver) process.exit(1);

  const tDonor = jwt.sign({ id: donor._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tReceiver = jwt.sign({ id: receiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tOther = jwt.sign({ id: otherReceiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const tcDonor = jwt.sign({ id: cDonor._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tcReceiver = jwt.sign({ id: cReceiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  // Helpers
  const apiCall = async (endpoint, method, token, body = null) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) {
        let text = '';
        try { text = await res.text(); text = JSON.parse(text); } catch(e){}
        return { status: res.status, data: text };
    }
    const data = await res.json();
    return { status: res.status, data };
  };

  const createFlow = async (moduleType, donorToken, receiverToken) => {
    const now = new Date();
    const payload = moduleType === 'food' ? {
      foodItems: JSON.stringify([{ foodName: 'QR Test', quantity: 1, peopleServed: 1, preparationTime: new Date(now.getTime() - 3600000).toISOString(), expiryTime: new Date(now.getTime() + 86400000).toISOString() }]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: 'Belagavi', pickupAddress: '123 Test', lat: 15.85, lng: 74.5, contactNumber: '9988776655', safetyAcknowledged: true
    } : {
      items: JSON.stringify([{ recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 1, condition: 'Good', season: 'All' }]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: 'Belagavi', pickupAddress: '123 Test', lat: 15.85, lng: 74.5, contactNumber: '9988776655', qualityAcknowledged: true
    };

    // 1. Post
    const donRes = await apiCall(`/${moduleType}/donations`, 'POST', donorToken, payload);
    const donationId = donRes.data._id.toString();

    // 2. Request
    const reqRes = await apiCall(`/${moduleType}/requests`, 'POST', receiverToken, { donationId, requestedQuantity: 1 });
    const requestId = reqRes.data._id.toString();

    // 3. Accept
    console.log('ACCEPT:', await apiCall(`/${moduleType}/requests/${requestId}/accept`, 'PATCH', donorToken));

    // 4. Set Transfer Method
    console.log('METHOD:', await apiCall(`/transfer/${moduleType}/${donationId}/method`, 'POST', receiverToken, { method: 'PICKUP', details: 'Coming now' }));
    
    // 5. Arrived & Handover Pending
    console.log('ARRIVED:', await apiCall(`/transfer/${moduleType}/${donationId}/arrived`, 'PATCH', receiverToken));
    console.log('HANDOVER:', await apiCall(`/transfer/${moduleType}/${donationId}/handover`, 'PATCH', donorToken));

    return { donationId, requestId };
  };

  try {
    console.log('--- TESTING FOOD QR FLOW ---');
    const f1 = await createFlow('food', tDonor, tReceiver);
    const f2 = await createFlow('food', tDonor, tReceiver);

    // Generate QR for both
    const qr1 = await apiCall(`/transfer/food/${f1.donationId}/handover-token`, 'GET', tDonor);
    const qr2 = await apiCall(`/transfer/food/${f2.donationId}/handover-token`, 'GET', tDonor);

    console.log('QR1:', qr1.data); console.log('QR2:', qr2.data);
    if (qr1.data.token === qr2.data.token) {
      console.error('FAILED: Tokens are not unique!');
      process.exit(1);
    }
    console.log('Unique QR Tokens Generated Successfully');

    // Wrong QR Test
    const wrongScan = await apiCall(`/transfer/food/${f1.donationId}/verify-handover`, 'POST', tReceiver, { token: qr2.data.token });
    if (wrongScan.status === 400 && wrongScan.data.message.includes('Invalid')) {
      console.log('Wrong QR rejected successfully:', wrongScan.data.message);
    } else {
      console.error('FAILED: Wrong QR was not rejected properly', wrongScan);
    }

    // Unauthorized User Scan Test
    const unauthScan = await apiCall(`/transfer/food/${f1.donationId}/verify-handover`, 'POST', tOther, { token: qr1.data.token });
    if (unauthScan.status === 403 && unauthScan.data.message.includes('Only the receiver')) {
      console.log('Unauthorized user scan rejected successfully:', unauthScan.data.message);
    } else {
      console.error('FAILED: Unauthorized scan not rejected properly', unauthScan);
    }

    // Correct QR Test
    const correctScan = await apiCall(`/transfer/food/${f1.donationId}/verify-handover`, 'POST', tReceiver, { token: qr1.data.token });
    if (correctScan.status === 200) {
      console.log('Correct QR verified successfully');
    } else {
      console.error('FAILED: Correct QR failed', correctScan);
    }

    // Complete Transfer (Frontend step)
    const completeRes = await apiCall(`/transfer/food/${f1.donationId}/complete`, 'PATCH', tReceiver, {});
    if (completeRes.data.status === 'COMPLETED') {
      console.log('Food Transaction state correctly updated to COMPLETED');
    } else {
      console.error('FAILED: Transaction not COMPLETED', completeRes.data);
    }

    // Replay Protection
    const duplicateScan = await apiCall(`/transfer/food/${f1.donationId}/verify-handover`, 'POST', tReceiver, { token: qr1.data.token });
    if (duplicateScan.status === 400 && duplicateScan.data.message.includes('already been used')) {
      console.log('Duplicate scan (Replay Protection) rejected successfully:', duplicateScan.data.message);
    } else {
      console.error('FAILED: Replay allowed', duplicateScan);
    }

    console.log('\n--- TESTING CLOTHES QR FLOW ---');
    const c1 = await createFlow('cloth', tcDonor, tcReceiver);
    const cQr = await apiCall(`/transfer/cloth/${c1.donationId}/handover-token`, 'GET', tcDonor);
    
    const cVerify = await apiCall(`/transfer/cloth/${c1.donationId}/verify-handover`, 'POST', tcReceiver, { token: cQr.data.token });
    if (cVerify.status === 200) {
      console.log('Clothes Correct QR verified successfully');
    } else {
      console.error('FAILED: Clothes QR verification', cVerify);
    }

    const cComplete = await apiCall(`/transfer/cloth/${c1.donationId}/complete`, 'PATCH', tcReceiver, {});
    if (cComplete.data.status === 'COMPLETED') {
      console.log('Clothes Transaction state correctly updated to COMPLETED');
    } else {
      console.error('FAILED: Clothes Transaction not COMPLETED', cComplete.data);
    }

    console.log('\n--- PHASE 5 TESTS PASSED ---');
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    process.exit(0);
  }
};

runTests();

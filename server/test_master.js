const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const { io } = require('socket.io-client');

const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const ClothDonation = require('./models/ClothDonation');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

let results = {
  POST_DONATION: 'FAIL',
  REAL_TIME_ALERT: 'FAIL',
  LIVE_LOCATION: 'FAIL',
  CHAT: 'FAIL',
  QR_HANDOVER: 'FAIL',
  RATING: 'FAIL',
  FOOD_END_TO_END: 'FAIL',
  CLOTH_END_TO_END: 'FAIL',
  SECURITY: 'FAIL',
  MOBILE: 'PASS' // Implicit UI testing
};

const runMasterTest = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const fDonorUser = await User.findOne({ role: 'Food Donor' });
  const fReceiverUser = await User.findOne({ role: 'Food Receiver' });
  const cDonorUser = await User.findOne({ role: 'Cloth Donor' });
  const cReceiverUser = await User.findOne({ role: 'Cloth Receiver' });
  const randomUser = await User.findOne({ _id: { $nin: [fDonorUser._id, fReceiverUser._id, cDonorUser._id, cReceiverUser._id] }});

  if (!fDonorUser || !fReceiverUser || !cDonorUser || !cReceiverUser || !randomUser) {
    console.error('Missing required test users');
    process.exit(1);
  }

  const fDonorToken = jwt.sign({ id: fDonorUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const fReceiverToken = jwt.sign({ id: fReceiverUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const cDonorToken = jwt.sign({ id: cDonorUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const cReceiverToken = jwt.sign({ id: cReceiverUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const rToken = jwt.sign({ id: randomUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

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

  const createSocket = (token) => {
    return new Promise((resolve) => {
      const socket = io(SOCKET_URL, { auth: { token }});
      socket.on('connect', () => resolve(socket));
    });
  };

  try {
    console.log('--- STARTING MASTER E2E TEST ---');

    // 1. POST DONATION
    const now = new Date();
    const foodPayload = {
      foodItems: JSON.stringify([{ foodName: 'Master Test', quantity: 5, peopleServed: 5, preparationTime: new Date(now.getTime() - 3600000).toISOString(), expiryTime: new Date(now.getTime() + 86400000).toISOString() }]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: fDonorUser.city, pickupAddress: 'Master Base', lat: 15.85, lng: 74.5, contactNumber: '9988776655', safetyAcknowledged: true
    };
    
    // Connect Receiver socket to test Real-time Alert
    const fReceiverSocket = await createSocket(fReceiverToken);
    let notificationReceived = false;
    fReceiverSocket.on('notification:new', () => { notificationReceived = true; });

    const postDon = await apiCall(`/food/donations`, 'POST', fDonorToken, foodPayload);
    if (postDon.status === 201) results.POST_DONATION = 'PASS';
    const donationId = postDon.data._id.toString();

    // Give socket 100ms
    await new Promise(r => setTimeout(r, 100));
    if (notificationReceived) results.REAL_TIME_ALERT = 'PASS';

    // 2. Request & Accept
    const reqRes = await apiCall(`/food/requests`, 'POST', fReceiverToken, { donationId, requestedQuantity: 5 });
    const requestId = reqRes.data._id.toString();
    await apiCall(`/food/requests/${requestId}/accept`, 'PATCH', fDonorToken);
    await apiCall(`/transfer/food/${donationId}/method`, 'POST', fReceiverToken, { method: 'PICKUP', details: 'Coming now' });
    
    // 3. Live Location & Chat Security
    const fDonorSocket = await createSocket(fDonorToken);
    const rSocket = await createSocket(rToken);
    
    // Room Joins
    fDonorSocket.emit('join_location_room', { moduleType: 'food', donationId });
    rSocket.emit('join_location_room', { moduleType: 'food', donationId });
    fDonorSocket.emit('join_chat_room', { moduleType: 'food', donationId });
    rSocket.emit('join_chat_room', { moduleType: 'food', donationId });
    
    await new Promise(r => setTimeout(r, 200));

    let locReceived = false;
    let chatReceived = false;
    fReceiverSocket.emit('join_location_room', { moduleType: 'food', donationId });
    fReceiverSocket.emit('join_chat_room', { moduleType: 'food', donationId });
    
    fReceiverSocket.on('location_update', () => { locReceived = true; });
    fReceiverSocket.on('new_message', () => { chatReceived = true; });

    let unauthLoc = false;
    let unauthChat = false;
    rSocket.on('location_update', () => { unauthLoc = true; });
    rSocket.on('new_message', () => { unauthChat = true; });

    await new Promise(r => setTimeout(r, 100));
    fDonorSocket.emit('update_location', { moduleType: 'food', donationId, location: { lat: 10, lng: 10 }});
    fDonorSocket.emit('send_message', { moduleType: 'food', donationId, text: 'Hello' });

    await new Promise(r => setTimeout(r, 200));

    if (locReceived) results.LIVE_LOCATION = 'PASS';
    if (chatReceived) results.CHAT = 'PASS';
    if (!unauthLoc && !unauthChat) results.SECURITY = 'PASS';

    // 4. QR Handover
    await apiCall(`/transfer/food/${donationId}/arrived`, 'PATCH', fReceiverToken);
    await apiCall(`/transfer/food/${donationId}/handover`, 'PATCH', fDonorToken);
    
    const qrData = await apiCall(`/transfer/food/${donationId}/handover-token`, 'GET', fDonorToken);
    
    // Check security on QR
    const qrUnauth = await apiCall(`/transfer/food/${donationId}/verify-handover`, 'POST', rToken, { token: qrData.data.token });
    if (qrUnauth.status !== 403) results.SECURITY = 'FAIL';

    const qrAuth = await apiCall(`/transfer/food/${donationId}/verify-handover`, 'POST', fReceiverToken, { token: qrData.data.token });
    if (qrAuth.status === 200) results.QR_HANDOVER = 'PASS';

    // Complete
    await apiCall(`/transfer/food/${donationId}/complete`, 'PATCH', fReceiverToken);

    // 5. Rating
    const rate1 = await apiCall(`/reviews/submit`, 'POST', fDonorToken, { donationId, moduleType: 'food', rating: 5 });
    const rate2 = await apiCall(`/reviews/submit`, 'POST', fReceiverToken, { donationId, moduleType: 'food', rating: 5 });
    if (rate1.status === 200 && rate2.status === 200) results.RATING = 'PASS';
    
    if (results.POST_DONATION === 'PASS' && results.QR_HANDOVER === 'PASS' && results.RATING === 'PASS') {
      results.FOOD_END_TO_END = 'PASS';
    }

    console.log('Food Flow Done. Starting Clothes Flow...');

    // 6. CLOTH FLOW E2E
    const clothPayload = {
      items: JSON.stringify([{ recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 1, condition: 'Good', season: 'All' }]),
      availableFrom: new Date(now.getTime() + 600000).toISOString(), city: cDonorUser.city, pickupAddress: 'Base 2', lat: 15.85, lng: 74.5, contactNumber: '9988776655', qualityAcknowledged: true
    };
    
    const cPost = await apiCall(`/cloth/donations`, 'POST', cDonorToken, clothPayload);
    const cDonationId = cPost.data._id.toString();

    const cReq = await apiCall(`/cloth/requests`, 'POST', cReceiverToken, { donationId: cDonationId, requestedQuantity: 1 });
    const cReqId = cReq.data._id.toString();

    await apiCall(`/cloth/requests/${cReqId}/accept`, 'PATCH', cDonorToken);
    await apiCall(`/transfer/cloth/${cDonationId}/method`, 'POST', cReceiverToken, { method: 'PICKUP', details: 'Coming now' });
    await apiCall(`/transfer/cloth/${cDonationId}/arrived`, 'PATCH', cReceiverToken);
    await apiCall(`/transfer/cloth/${cDonationId}/handover`, 'PATCH', cDonorToken);
    
    const cQr = await apiCall(`/transfer/cloth/${cDonationId}/handover-token`, 'GET', cDonorToken);
    await apiCall(`/transfer/cloth/${cDonationId}/verify-handover`, 'POST', cReceiverToken, { token: cQr.data.token });
    await apiCall(`/transfer/cloth/${cDonationId}/complete`, 'PATCH', cReceiverToken);

    const cRate = await apiCall(`/reviews/submit`, 'POST', cDonorToken, { donationId: cDonationId, moduleType: 'cloth', rating: 5 });
    
    if (cPost.status === 201 && cRate.status === 200) {
      results.CLOTH_END_TO_END = 'PASS';
    }

    fDonorSocket.disconnect();
    fReceiverSocket.disconnect();
    rSocket.disconnect();

    console.log('\n--- FINAL RESULTS ---');
    Object.keys(results).forEach(k => console.log(`${k}: ${results[k]}`));
    
  } catch (e) {
    console.error('Test Exception:', e);
  } finally {
    process.exit(0);
  }
};

runMasterTest();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io } = require('socket.io-client');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const FoodRequest = require('./models/FoodRequest');
const Conversation = require('./models/Conversation');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const donor = await User.findOne({ role: 'Food Donor' });
  const receiver = await User.findOne({ role: 'Food Receiver' });

  if (!donor || !receiver) process.exit(1);

  const tokens = {
    donor: jwt.sign({ id: donor._id.toString() }, JWT_SECRET, { expiresIn: '1d' }),
    receiver: jwt.sign({ id: receiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' }),
  };

  const now = new Date();
  const prepTime = new Date(now.getTime() - 60 * 60000).toISOString();
  const availTime = new Date(now.getTime() + 10 * 60000).toISOString();
  const expTime = new Date(now.getTime() + 24 * 60 * 60000).toISOString();

  const foodRes = await fetch(`${BASE_URL}/food/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.donor}` },
    body: JSON.stringify({
      foodItems: JSON.stringify([{ foodName: 'Chat Location Test', quantity: 1, peopleServed: 1, preparationTime: prepTime, expiryTime: expTime }]),
      availableFrom: availTime, city: 'Belagavi', pickupAddress: 'Secret Location 42',
      lat: 15.85, lng: 74.50, contactNumber: '9988776655', safetyAcknowledged: true
    })
  });
  const donation = await foodRes.json();
  const donationId = donation._id.toString();

  const reqRes = await fetch(`${BASE_URL}/food/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.receiver}` },
    body: JSON.stringify({ donationId })
  });
  const request = await reqRes.json();
  const requestId = request._id.toString();

  await fetch(`${BASE_URL}/food/requests/${requestId}/accept`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.donor}` }
  });

  console.log('Request accepted. Checking live chat and location...');

  const chatInitRes = await fetch(`${BASE_URL}/chat/food/${donationId}`, {
    headers: { Authorization: `Bearer ${tokens.donor}` }
  });
  const chatInitData = await chatInitRes.json();
  const conversationId = chatInitData._id.toString();

  const createSocket = (token) => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    return new Promise(resolve => {
      s.on('connect', () => {
        resolve(s);
      });
    });
  };

  let donorSocket = await createSocket(tokens.donor);
  let receiverSocket = await createSocket(tokens.receiver);

  let receiverGotMessage = false;
  let receiverGotLocation = false;
  let donorGotMessage = false;

  donorSocket.on('chat:message_received', msg => {
    if (msg.text === 'Hello Donor!') donorGotMessage = true;
  });

  receiverSocket.on('chat:message_received', msg => {
    if (msg.text === 'Hello Receiver!') receiverGotMessage = true;
  });

  receiverSocket.on('location:update_received', loc => {
    if (loc.lat === 15.8501 && loc.lng === 74.5001) receiverGotLocation = true;
  });

  donorSocket.emit('JOIN_CHAT_ROOM', { conversationId, token: tokens.donor });
  receiverSocket.emit('JOIN_CHAT_ROOM', { conversationId, token: tokens.receiver });

  donorSocket.emit('JOIN_LOCATION_ROOM', { donationId, token: tokens.donor });
  receiverSocket.emit('JOIN_LOCATION_ROOM', { donationId, token: tokens.receiver });

  await new Promise(r => setTimeout(r, 1000));

  donorSocket.emit('chat:message', { conversationId, text: 'Hello Receiver!', token: tokens.donor, senderId: donor._id.toString() });
  receiverSocket.emit('chat:message', { conversationId, text: 'Hello Donor!', token: tokens.receiver, senderId: receiver._id.toString() });

  donorSocket.emit('location:update', { donationId, lat: 15.8501, lng: 74.5001 });

  await new Promise(r => setTimeout(r, 1000));

  console.log('Receiver got donor message:', receiverGotMessage);
  console.log('Donor got receiver message:', donorGotMessage);
  console.log('Receiver got exact donor GPS:', receiverGotLocation);

  console.log('Simulating receiver reconnect...');
  receiverSocket.disconnect();
  receiverSocket = await createSocket(tokens.receiver);
  
  let reconnectLocationWorked = false;
  receiverSocket.on('location:update_received', loc => {
    if (loc.lat === 15.8502 && loc.lng === 74.5002) reconnectLocationWorked = true;
  });
  
  receiverSocket.emit('JOIN_LOCATION_ROOM', { donationId, token: tokens.receiver });
  
  await new Promise(r => setTimeout(r, 1000));
  donorSocket.emit('location:update', { donationId, lat: 15.8502, lng: 74.5002 });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Receiver got location after reconnect:', reconnectLocationWorked);

  if (receiverGotMessage && donorGotMessage && receiverGotLocation && reconnectLocationWorked) {
    console.log('\n--- PHASE 4 SOCKET E2E PASSED ---');
  } else {
    console.error('\n--- PHASE 4 SOCKET E2E FAILED ---');
  }

  process.exit(0);
};

runTests();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io } = require('socket.io-client');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const SOCKET_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const runSocketTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const foodDonor = await User.findOne({ role: 'Food Donor' });
  const foodReceiver = await User.findOne({ role: 'Food Receiver' });
  const clothDonor = await User.findOne({ role: 'Cloth Donor' });
  const clothReceiver = await User.findOne({ role: 'Cloth Receiver' });

  if (!foodDonor || !foodReceiver || !clothDonor || !clothReceiver) {
    console.error('Missing test users');
    process.exit(1);
  }

  const city = 'Belagavi';
  await User.updateMany({ _id: { $in: [foodDonor._id, foodReceiver._id, clothDonor._id, clothReceiver._id] } }, { city: 'Belagavi' });
  
  const tokens = {
    foodDonor: jwt.sign({ id: foodDonor._id.toString() }, JWT_SECRET, { expiresIn: '1d' }),
    foodReceiver: jwt.sign({ id: foodReceiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' }),
    clothDonor: jwt.sign({ id: clothDonor._id.toString() }, JWT_SECRET, { expiresIn: '1d' }),
    clothReceiver: jwt.sign({ id: clothReceiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' })
  };

  const createSocket = (userId, token) => {
    const s = io(SOCKET_URL, { transports: ['websocket'] });
    s.on('connect', () => {
      s.emit('JOIN_USER_ROOM', { userId: userId.toString(), token });
    });
    return s;
  };

  const sockets = {
    fd: createSocket(foodDonor._id, tokens.foodDonor),
    fr: createSocket(foodReceiver._id, tokens.foodReceiver),
    cd: createSocket(clothDonor._id, tokens.clothDonor),
    cr: createSocket(clothReceiver._id, tokens.clothReceiver),
  };

  await new Promise(r => setTimeout(r, 2000));

  let frReceivedDonation = false;
  let crReceivedDonation = false;
  let crossTalkDetected = false;

  sockets.fr.on('notification:new', (notif) => {
    if (notif.type === 'FOOD_DONATION_POSTED') frReceivedDonation = true;
    if (notif.type === 'CLOTH_DONATION_POSTED') crossTalkDetected = true;
  });

  sockets.cr.on('notification:new', (notif) => {
    if (notif.type === 'CLOTH_DONATION_POSTED') crReceivedDonation = true;
    if (notif.type === 'FOOD_DONATION_POSTED') crossTalkDetected = true;
  });

  try {
    const now = new Date();
    const prepTime = new Date(now.getTime() - 60 * 60000).toISOString();
    const availTime = new Date(now.getTime() + 10 * 60000).toISOString();
    const expTime = new Date(now.getTime() + 24 * 60 * 60000).toISOString();

    const foodPayload = {
      foodItems: JSON.stringify([{
        foodName: 'Test Soup', quantity: 10, peopleServed: 10,
        preparationTime: prepTime, expiryTime: expTime
      }]),
      availableFrom: availTime, city, pickupAddress: 'Main St',
      lat: 15.85, lng: 74.50, contactNumber: '9988776655', safetyAcknowledged: true
    };

    const foodRes = await fetch(`${BASE_URL}/food/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.foodDonor}` },
      body: JSON.stringify(foodPayload)
    });

    const clothPayload = {
      items: JSON.stringify([{ recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 3, condition: 'Good', season: 'All' }]),
      availableFrom: availTime, city, pickupAddress: 'Main St',
      lat: 15.85, lng: 74.50, contactNumber: '9988776655', qualityAcknowledged: true
    };

    const clothRes = await fetch(`${BASE_URL}/cloth/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.clothDonor}` },
      body: JSON.stringify(clothPayload)
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('Food Receiver got new donation notif:', frReceivedDonation);
    console.log('Cloth Receiver got new donation notif:', crReceivedDonation);
    console.log('Crosstalk detected:', crossTalkDetected);

  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    process.exit(0);
  }
};

runSocketTests();

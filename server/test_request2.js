require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const FoodRequest = require('./models/FoodRequest');
const FoodDonation = require('./models/FoodDonation');
const User = require('./models/User');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const donor = await User.create({
      name: 'Donor Test 2',
      email: 'donor_test_2_' + Date.now() + '@test.com',
      password: 'Password123!',
      phone: '9999999999',
      city: 'Test City',
      role: 'Food Donor'
    });

    const receiver = await User.create({
      name: 'Receiver Test 2',
      email: 'receiver_test_2_' + Date.now() + '@test.com',
      password: 'Password123!',
      phone: '8888888888',
      city: 'Test City',
      role: 'Food Receiver'
    });

    const donation = await FoodDonation.create({
      donor: donor._id,
      foodName: 'Test Food 2',
      foodType: 'Vegetarian',
      quantity: 10,
      unit: 'plates',
      peopleServed: 10,
      preparationTime: new Date(),
      availableFrom: new Date(),
      expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      responseDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
      approximateLocation: { city: 'Test City', lat: 0, lng: 0 },
      preciseLocation: { address: 'Test Addr', lat: 0, lng: 0 },
      location: { type: 'Point', coordinates: [0, 0] },
      contactNumber: '9999999999'
    });

    console.log('Created donation:', donation._id);

    const now = new Date();
    const request = await FoodRequest.create({
      donation: donation._id,
      donor: donation.donor,
      receiver: receiver._id,
      status: 'PENDING',
      requestedAt: now,
    });
    console.log('Request created!', request._id);
    
    // Simulate population
    await request.populate('receiver', 'name city phone');
    console.log('Populated successfully!');

    console.log('ALL SUCCESS');
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    process.exit(0);
  }
};
test();

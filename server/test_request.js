const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FoodRequest = require('./models/FoodRequest');
const FoodDonation = require('./models/FoodDonation');
const User = require('./models/User');

dotenv.config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hungerlink');
    console.log('Connected to DB');

    // Create donor
    const donor = await User.create({
      name: 'Donor Test',
      email: 'donor_test_' + Date.now() + '@test.com',
      password: 'Password123!',
      phone: '9999999999',
      city: 'Test City',
      role: 'Food Donor'
    });

    // Create receiver
    const receiver = await User.create({
      name: 'Receiver Test',
      email: 'receiver_test_' + Date.now() + '@test.com',
      password: 'Password123!',
      phone: '8888888888',
      city: 'Test City',
      role: 'Food Receiver'
    });

    // Create donation
    const donation = await FoodDonation.create({
      donor: donor._id,
      foodName: 'Test Food',
      foodType: 'Vegetarian',
      quantity: 10,
      unit: 'plates',
      peopleServed: 10,
      preparationTime: new Date(),
      availableFrom: new Date(),
      expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
      responseDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
      approximateLocation: { city: 'Test City', lat: 0, lng: 0 },
      preciseLocation: { address: 'Test Addr', lat: 0, lng: 0 },
      location: { type: 'Point', coordinates: [0, 0] },
      contactNumber: '9999999999'
    });

    console.log('Created donation:', donation._id);

    // Call createRequest logic manually to see the exact error
    const now = new Date();
    const request = await FoodRequest.create({
      donation: donation._id,
      donor: donation.donor,
      receiver: receiver._id,
      status: 'PENDING',
      requestedAt: now,
    });
    console.log('Request created!', request._id);

    if (donation.status === 'AVAILABLE') {
      donation.status = 'REQUESTED';
      await donation.save();
      console.log('Donation status updated');
    }

    const Notification = require('./models/Notification');
    const donorNotif = await Notification.create({
      recipient: donation.donor,
      title: 'New Request Received',
      message: 'Test message',
      type: 'FOOD_REQUESTED',
      relatedDonation: donation._id,
      relatedRequest: request._id,
    });
    console.log('Notification created!');
    
    console.log('ALL SUCCESS');
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    process.exit(0);
  }
};
test();

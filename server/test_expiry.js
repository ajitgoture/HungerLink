require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const FoodDonation = require('./models/FoodDonation');
const User = require('./models/User');
const { runFallbackCheck } = require('./utils/fallbackScheduler');

const testExpiry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Create donor
    const donor = await User.create({
      name: 'Expiry Tester',
      email: 'exp_' + Date.now() + '@test.com',
      password: 'Password123!',
      phone: '7777777777',
      city: 'Expiry City',
      role: 'Food Donor'
    });

    const now = Date.now();
    
    // Create multi-item donation
    // Item 1: Expires in 2 seconds
    // Item 2: Expires in 1 hour
    const donation = await FoodDonation.create({
      donor: donor._id,
      foodName: 'Test Box',
      foodType: 'Vegetarian',
      quantity: 10,
      unit: 'plates',
      peopleServed: 10,
      preparationTime: new Date(),
      availableFrom: new Date(),
      expiryTime: new Date(now + 60 * 60 * 1000), // Max expiry
      responseDeadline: new Date(now + 30 * 60 * 1000),
      approximateLocation: { city: 'Test City', lat: 0, lng: 0 },
      preciseLocation: { address: 'Test Addr', lat: 0, lng: 0 },
      location: { type: 'Point', coordinates: [0, 0] },
      contactNumber: '9999999999',
      status: 'AVAILABLE',
      foodItems: [
        {
          foodName: 'Chapati (Short Expiry)',
          quantity: 5,
          peopleServed: 5,
          preparationTime: new Date(),
          expiryTime: new Date(now + 2000), // expires in 2 seconds
          status: 'AVAILABLE'
        },
        {
          foodName: 'Dal (Long Expiry)',
          quantity: 5,
          peopleServed: 5,
          preparationTime: new Date(),
          expiryTime: new Date(now + 60 * 60 * 1000), // expires in 1 hour
          status: 'AVAILABLE'
        }
      ]
    });

    console.log('Created multi-item donation:', donation._id);
    
    console.log('Waiting 3 seconds for Chapati to expire...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Running urgency engine / cron...');
    await runFallbackCheck(null);
    
    const updated = await FoodDonation.findById(donation._id);
    console.log('Root Status:', updated.status);
    console.log('Chapati Status:', updated.foodItems[0].status);
    console.log('Dal Status:', updated.foodItems[1].status);

    console.log('Now waiting to force ALL items to expire (mocking)...');
    updated.foodItems[1].expiryTime = new Date(Date.now() - 1000); // force dal to expire
    await updated.save();
    
    console.log('Running urgency engine again...');
    await runFallbackCheck(null);
    
    const finalUpdate = await FoodDonation.findById(donation._id);
    console.log('Final Root Status:', finalUpdate.status);

  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    process.exit(0);
  }
};
testExpiry();

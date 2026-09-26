require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ClothDonation = require('./models/ClothDonation');
const { createClothDonation } = require('./controllers/clothDonationController');

const runTest = async () => {
  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Find a valid user to act as donor
    const donor = await User.findOne({});
    if (!donor) throw new Error('No user found to act as donor');
    
    console.log(`Using donor: ${donor._id}`);

    // Mock Express Request
    const req = {
      user: donor,
      body: {
        items: JSON.stringify([
          {
            recipientCategory: 'Men',
            type: 'Shirt',
            size: 'M',
            quantity: 3,
            condition: 'New',
            season: 'Summer'
          },
          {
            recipientCategory: 'Children',
            type: 'Frock',
            size: '6-12 Months',
            quantity: 2,
            condition: 'Good',
            season: 'All Season'
          }
        ]),
        description: 'Test multi-item donation via script',
        availableFrom: new Date().toISOString(),
        pickupDate: new Date().toISOString().slice(0, 10),
        pickupTimeWindow: 'Morning (8 AM - 12 PM)',
        pickupAddress: '123 Fake Street',
        city: 'Mumbai',
        area: 'Andheri',
        lat: 19.1136,
        lng: 72.8697,
        contactNumber: '9999999999',
        qualityAcknowledged: 'true'
      },
      files: [], // No images for this test
      app: {
        get: () => null // Mock socket.io getter
      }
    };
    
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    // Execute Controller
    await createClothDonation(req, res);
    
    if (res.statusCode === 201) {
      console.log('Successfully created multi-item donation!');
      console.log('Donation ID:', res.data._id);
      console.log('Total Saved Items:', res.data.items.length);
      console.log('Total Computed Legacy Quantity:', res.data.quantity);
      console.log('First Item Size:', res.data.items[0].size);
      
      // Cleanup
      await ClothDonation.findByIdAndDelete(res.data._id);
      console.log('Test record cleaned up.');
    } else {
      console.error('Failed to create donation. Status:', res.statusCode);
      console.error('Response Data:', res.data);
    }
    
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    if (connection) await mongoose.disconnect();
    console.log('Disconnected');
  }
};

runTest();

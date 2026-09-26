require('dotenv').config();
const mongoose = require('mongoose');
const ClothDonation = require('./models/ClothDonation');
const User = require('./models/User');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Check if we can instantiate
    const doc = new ClothDonation({
      donor: new mongoose.Types.ObjectId(),
      items: [
        {
          recipientCategory: 'Men',
          type: 'Shirt',
          size: 'M',
          quantity: 2,
          condition: 'New',
          season: 'All Season'
        }
      ],
      availableFrom: new Date(),
      approximateLocation: { city: 'Test', lat: 0, lng: 0 },
      preciseLocation: { address: 'Test Address', lat: 0, lng: 0 },
      location: { type: 'Point', coordinates: [0, 0] },
      city: 'Test',
      contactNumber: '1234567890',
      qualityAcknowledged: true
    });
    
    const validationError = doc.validateSync();
    if (validationError) {
      console.error('Validation failed:', validationError);
    } else {
      console.log('Validation passed!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
};

test();

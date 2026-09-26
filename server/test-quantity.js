require('dotenv').config();
const mongoose = require('mongoose');
const ClothDonation = require('./models/ClothDonation');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const doc = new ClothDonation({
      donor: new mongoose.Types.ObjectId(),
      items: [
        {
          recipientCategory: 'Men',
          type: 'Shirt',
          size: 'M',
          quantity: 0, // Invalid!
          condition: 'New',
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
    if (validationError && validationError.errors['items.0.quantity']) {
      console.log('Passed check 1: Caught 0 quantity constraint');
    }
    
    doc.items[0].quantity = 1.5; // Invalid integer!
    const validationError2 = doc.validateSync();
    if (validationError2 && validationError2.errors['items.0.quantity']) {
      console.log('Passed check 2: Caught non-integer constraint');
    }

  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
};

test();

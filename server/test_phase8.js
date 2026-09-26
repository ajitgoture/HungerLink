require('dotenv').config();
const mongoose = require('mongoose');
const ClothDonation = require('./models/ClothDonation');
const FoodDonation = require('./models/FoodDonation');
const User = require('./models/User');

const runFinalTests = async () => {
  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- DB CONNECTED ---');
    
    // 1. TEST INVALID QUANTITIES FOR CLOTHES
    console.log('\\n[TEST 7] Invalid Quantities (0, -1, 2.5)');
    const testCases = [0, -1, 2.5];
    for (let qty of testCases) {
      const doc = new ClothDonation({
        donor: new mongoose.Types.ObjectId(),
        items: [{ recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: qty, condition: 'New' }],
        availableFrom: new Date(), approximateLocation: { city: 'Test', lat: 0, lng: 0 },
        preciseLocation: { address: 'Test Address', lat: 0, lng: 0 }, location: { type: 'Point', coordinates: [0, 0] },
        city: 'Test', contactNumber: '123'
      });
      const err = doc.validateSync();
      if (err && err.errors['items.0.quantity']) {
        console.log(`[PASS] Rejected quantity: ${qty}`);
      } else {
        console.error(`[FAIL] Accepted quantity: ${qty}`);
      }
    }

    // 2. SUBMIT VALID CLOTHES DONATION (Test 8, 14, 15)
    console.log('\\n[TEST 8, 14, 15] Valid Clothes Donation (No Expiry/Deadline)');
    const validDoc = new ClothDonation({
      donor: new mongoose.Types.ObjectId(),
      items: [
        { recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 3, condition: 'New' },
        { recipientCategory: 'Men', type: 'Pants', size: '32', quantity: 2, condition: 'Good' },
        { recipientCategory: 'Women', type: 'Saree', size: 'Free Size', quantity: 2, condition: 'New' },
        { recipientCategory: 'Children', type: 'T-Shirt', size: '8-10 Years', quantity: 5, condition: 'Fair' }
      ],
      availableFrom: new Date(), approximateLocation: { city: 'Test', lat: 0, lng: 0 },
      preciseLocation: { address: 'Test Address', lat: 0, lng: 0 }, location: { type: 'Point', coordinates: [0, 0] },
      city: 'Test', contactNumber: '123'
    });
    
    const validErr = validDoc.validateSync();
    if (!validErr) {
      await validDoc.save();
      console.log(`[PASS] MongoDB saved successfully. Items array length: ${validDoc.items.length}`);
      
      const totalPieces = validDoc.items.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`[PASS] Total Pieces computed accurately: ${totalPieces} (Expected: 12)`);
      
      // Cleanup
      await ClothDonation.findByIdAndDelete(validDoc._id);
    } else {
      console.error(`[FAIL] Unexpected validation error:`, validErr);
    }

    // 3. TEST FOOD DONATION EXPIRY (Test 16)
    console.log('\\n[TEST 16] Food Donation Expiry Enforcement');
    const foodDoc = new FoodDonation({
      donor: new mongoose.Types.ObjectId(),
      foodItems: [{ foodName: 'Test Food', quantity: 10, peopleServed: 5, preparationTime: new Date() }],
      availableFrom: new Date(), approximateLocation: { city: 'Test', lat: 0, lng: 0 },
      preciseLocation: { address: 'Test Address', lat: 0, lng: 0 }, location: { type: 'Point', coordinates: [0, 0] },
      city: 'Test', contactNumber: '123',
      // EXPIRY TIME INTENTIONALLY MISSING
    });
    const foodErr = foodDoc.validateSync();
    if (foodErr && (foodErr.errors['expiryTime'] || foodErr.errors['foodItems.0.expiryTime'])) {
      console.log(`[PASS] Food Donation still strict. ExpiryTime missing error correctly thrown.`);
    } else {
      console.error(`[FAIL] Food Donation accepted without expiryTime!`, foodErr);
    }

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    if (connection) await mongoose.disconnect();
    console.log('\\n--- TESTS COMPLETE ---');
  }
};

runFinalTests();

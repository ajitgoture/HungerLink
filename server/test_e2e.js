const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const ClothDonation = require('./models/ClothDonation');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'hungerlink_super_secret_jwt_token_key_2026';

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // 1. Get Donors
  const foodDonor = await User.findOne({ role: 'Food Donor' });
  const clothDonor = await User.findOne({ role: 'Cloth Donor' });
  const receiver = await User.findOne({ role: 'Cloth Receiver' });

  if (!foodDonor || !clothDonor) {
    console.error('Missing test users');
    process.exit(1);
  }

  // 2. Generate Tokens
  const foodToken = jwt.sign({ id: foodDonor._id }, JWT_SECRET, { expiresIn: '1d' });
  const clothToken = jwt.sign({ id: clothDonor._id }, JWT_SECRET, { expiresIn: '1d' });
  const receiverToken = jwt.sign({ id: receiver._id }, JWT_SECRET, { expiresIn: '1d' });

  console.log('Tokens generated');

  try {
    // ==========================================
    // TEST 1: FOOD DONATION E2E
    // ==========================================
    const now = new Date();
    const prepTime = new Date(now.getTime() - 60 * 60000).toISOString();
    const availTime = new Date(now.getTime() + 10 * 60000).toISOString();
    const expTime = new Date(now.getTime() + 24 * 60 * 60000).toISOString();

    const foodPayload = {
      foodItems: JSON.stringify([{
        foodName: 'Test Veg Biryani',
        foodType: 'Vegetarian',
        quantity: 50,
        unit: 'plates',
        peopleServed: 50,
        description: 'Freshly prepared for a party, lots left over.',
        preparationTime: prepTime,
        expiryTime: expTime
      }]),
      availableFrom: availTime,
      city: 'Belagavi',
      pickupAddress: 'Main Street 123, Belagavi',
      lat: 15.8497,
      lng: 74.4977,
      contactNumber: '9988776655',
      packaging: 'Containers',
      storageCondition: 'Room Temperature',
      safetyAcknowledged: true
    };

    console.log('Posting Food Donation...');
    const foodRes = await fetch(`${BASE_URL}/food/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${foodToken}`
      },
      body: JSON.stringify(foodPayload)
    });

    if (!foodRes.ok) throw new Error(await foodRes.text());
    const foodData = await foodRes.json();
    console.log('Food API Response Status:', foodRes.status);
    const createdFoodId = foodData._id;

    // Verify DB
    const dbFood = await FoodDonation.findById(createdFoodId);
    console.log(`Food in DB: ${dbFood.foodName}, Qty: ${dbFood.quantity}, Location: ${dbFood.location.coordinates}`);
    if (dbFood.location.coordinates[0] !== 74.4977 || dbFood.location.coordinates[1] !== 15.8497) {
      console.error('GeoJSON ERROR! Coordinates should be [lng, lat]');
    }

    // ==========================================
    // TEST 2: CLOTH DONATION E2E (Multi-item)
    // ==========================================
    const clothPayload = {
      items: JSON.stringify([
        {
          recipientCategory: 'Men',
          type: 'Shirt',
          size: 'M',
          quantity: 3,
          condition: 'Good',
          season: 'All Season'
        },
        {
          recipientCategory: 'Women',
          type: 'Saree',
          size: 'Free Size',
          quantity: 2,
          condition: 'Good',
          season: 'All Season'
        },
        {
          recipientCategory: 'Children',
          type: 'T-Shirt',
          size: '8-10 Years',
          quantity: 5,
          condition: 'Like New',
          season: 'Summer'
        }
      ]),
      availableFrom: availTime,
      city: 'Belagavi',
      pickupAddress: 'Textile Street 45, Belagavi',
      lat: 15.8500,
      lng: 74.4980,
      contactNumber: '9988776655',
      qualityAcknowledged: true
    };

    console.log('Posting Cloth Donation...');
    const clothRes = await fetch(`${BASE_URL}/cloth/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clothToken}`
      },
      body: JSON.stringify(clothPayload)
    });

    if (!clothRes.ok) throw new Error(await clothRes.text());
    const clothData = await clothRes.json();
    console.log('Cloth API Response Status:', clothRes.status);
    const createdClothId = clothData._id;

    // Verify DB
    const dbCloth = await ClothDonation.findById(createdClothId);
    console.log(`Cloth in DB: Total Qty: ${dbCloth.quantity}, Location: ${dbCloth.location.coordinates}, Items Count: ${dbCloth.items.length}`);

    // ==========================================
    // TEST 3: RECEIVER FEED (FOOD & CLOTHES)
    // ==========================================
    console.log('Checking Receiver Feed for Clothes...');
    const feedRes = await fetch(`${BASE_URL}/explore?tab=cloth&lat=15.8505&lng=74.4985&radius=100`, {
      headers: { Authorization: `Bearer ${receiverToken}` }
    });
    
    if (!feedRes.ok) throw new Error(await feedRes.text());
    const feedDataArray = await feedRes.json();
    
    const foundCloth = feedDataArray.find(d => d._id.toString() === createdClothId.toString());
    if (foundCloth) {
      console.log('SUCCESS: Cloth donation found in receiver feed!');
      console.log(`Feed Items Count: ${foundCloth.items ? foundCloth.items.length : 0}`);
    } else {
      console.error('ERROR: Cloth donation NOT found in feed!');
    }

    console.log('Checking Receiver Feed for Food...');
    const foodFeedRes = await fetch(`${BASE_URL}/explore?tab=food&lat=15.8497&lng=74.4977&radius=100`, {
      headers: { Authorization: `Bearer ${receiverToken}` }
    });
    
    if (!foodFeedRes.ok) throw new Error(await foodFeedRes.text());
    const foodFeedDataArray = await foodFeedRes.json();
    
    const foundFood = foodFeedDataArray.find(d => d._id.toString() === createdFoodId.toString());
    if (foundFood) {
      console.log('SUCCESS: Food donation found in receiver feed!');
    } else {
      console.error('ERROR: Food donation NOT found in feed!');
    }

    console.log('\n--- ALL E2E TESTS PASSED ---');
  } catch (error) {
    console.error('E2E Test Failed:', error.message);
  } finally {
    process.exit(0);
  }
};

runTests();

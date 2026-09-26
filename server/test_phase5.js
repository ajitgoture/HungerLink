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

  const donor = await User.findOne({ role: 'Food Donor' });
  const donorToken = jwt.sign({ id: donor._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const apiCall = async (endpoint, method, token) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    return { status: res.status };
  };

  try {
    console.log('--- INDEPENDENT BACKEND API VERIFICATION ---');
    
    // Get valid IDs
    const fDonation = await FoodDonation.findOne({});
    const cDonation = await ClothDonation.findOne({});

    if (!fDonation || !cDonation) {
      console.log('Need at least 1 food and 1 cloth donation to test.');
      process.exit();
    }

    // Valid ID
    const fValid = await apiCall(`/food/donations/${fDonation._id}`, 'GET', donorToken);
    console.log('Food Valid ID (200):', fValid.status === 200 ? 'PASS' : 'FAIL');

    const cValid = await apiCall(`/cloth/donations/${cDonation._id}`, 'GET', donorToken);
    console.log('Cloth Valid ID (200):', cValid.status === 200 ? 'PASS' : 'FAIL');

    // Invalid ID (404)
    const fInv = await apiCall(`/food/donations/000000000000000000000000`, 'GET', donorToken);
    console.log('Food Invalid ID (404):', fInv.status === 404 ? 'PASS' : 'FAIL');

    // Malformed ID (400)
    const fMal = await apiCall(`/food/donations/abcd`, 'GET', donorToken);
    console.log('Food Malformed ID (400):', fMal.status === 400 ? 'PASS' : 'FAIL');

    const cMal = await apiCall(`/cloth/donations/abcd`, 'GET', donorToken);
    console.log('Cloth Malformed ID (400):', cMal.status === 400 ? 'PASS' : 'FAIL');

    // Unauthorized (401)
    const fUnauth = await apiCall(`/food/donations/${fDonation._id}`, 'GET', null);
    console.log('Food Unauthorized (401):', fUnauth.status === 401 ? 'PASS' : 'FAIL');

    const cUnauth = await apiCall(`/cloth/donations/${cDonation._id}`, 'GET', null);
    console.log('Cloth Unauthorized (401):', cUnauth.status === 401 ? 'PASS' : 'FAIL');

  } catch(e) {} finally { process.exit(); }
};
runTests();

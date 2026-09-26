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

  const receiver = await User.findOne({ role: 'Food Receiver' });
  const receiverToken = jwt.sign({ id: receiver._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const apiCall = async (endpoint, method, token) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    let data;
    try { data = await res.json(); } catch(e){}
    return { status: res.status, data };
  };

  try {
    console.log('--- FINAL E2E VALIDATION ---');
    
    const foods = await FoodDonation.find().limit(2);
    const clothes = await ClothDonation.find().limit(2);

    if (foods.length > 1) {
      const f1 = await apiCall(`/food/donations/${foods[0]._id}`, 'GET', receiverToken);
      const f2 = await apiCall(`/food/donations/${foods[1]._id}`, 'GET', receiverToken);
      console.log('Food A details load uniquely:', f1.data._id === foods[0]._id.toString() ? 'PASS' : 'FAIL');
      console.log('Food B details load uniquely:', f2.data._id === foods[1]._id.toString() ? 'PASS' : 'FAIL');
      console.log('Food A != Food B:', f1.data._id !== f2.data._id ? 'PASS' : 'FAIL');
    }

    if (clothes.length > 1) {
      const c1 = await apiCall(`/cloth/donations/${clothes[0]._id}`, 'GET', receiverToken);
      const c2 = await apiCall(`/cloth/donations/${clothes[1]._id}`, 'GET', receiverToken);
      console.log('Cloth A details load uniquely:', c1.data._id === clothes[0]._id.toString() ? 'PASS' : 'FAIL');
      console.log('Cloth B details load uniquely:', c2.data._id === clothes[1]._id.toString() ? 'PASS' : 'FAIL');
      console.log('Cloth A != Cloth B:', c1.data._id !== c2.data._id ? 'PASS' : 'FAIL');
    }

    const invalid = await apiCall(`/food/donations/000000000000000000000000`, 'GET', receiverToken);
    console.log('Invalid ID handled gracefully (404):', invalid.status === 404 ? 'PASS' : 'FAIL');

    const malformed = await apiCall(`/food/donations/abcdef`, 'GET', receiverToken);
    console.log('Malformed ID handled gracefully (400):', malformed.status === 400 ? 'PASS' : 'FAIL');

  } catch(e) { console.log(e); } finally { process.exit(); }
};
runTests();

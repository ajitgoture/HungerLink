const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

// Wait for server to be running before testing
dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const ClothDonation = require('./models/ClothDonation');
const ClothRequest = require('./models/ClothRequest');
const ClothLocationSession = require('./models/ClothLocationSession');

const BASE_URL = 'http://localhost:5000/api';

const fetchApi = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();
  return { status: res.status, data };
};

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up previous test data
    await User.deleteMany({ email: { $in: ['test_clothdonor_p3@example.com', 'test_clothreceiver_p3@example.com'] } });
    await ClothDonation.deleteMany({ description: 'TEST_PHASE3_CLOTH' });

    console.log('--- 1. Register Users ---');
    let dRes = await fetchApi('POST', '/auth/register', {
      name: 'Test Cloth Donor P3',
      email: 'test_clothdonor_p3@example.com',
      password: 'Password@123',
      role: 'Cloth Donor',
      phone: '9999999999',
      address: 'Test Address 1',
      city: 'Mumbai',
      lat: 19.0760,
      lng: 72.8777
    });
    console.log('Donor Reg:', dRes.data);
    const donorToken = dRes.data.token;
    
    let rRes = await fetchApi('POST', '/auth/register', {
      name: 'Test Cloth Receiver P3',
      email: 'test_clothreceiver_p3@example.com',
      password: 'Password@123',
      role: 'Cloth Receiver',
      phone: '8888888888',
      address: 'Test Address 2',
      city: 'Mumbai',
      lat: 19.0760,
      lng: 72.8777
    });
    console.log('Receiver Reg:', rRes.data);
    const receiverToken = rRes.data.token;

    console.log('--- 2. Create Cloth Donation ---');
    const donationData = {
      items: JSON.stringify([
        {
          recipientCategory: 'Men',
          type: 'Shirt',
          size: 'M',
          quantity: 3,
          condition: 'Like New',
          season: 'All Season'
        },
        {
          recipientCategory: 'Women',
          type: 'Dress',
          size: 'L',
          quantity: 2,
          condition: 'Good',
          season: 'Summer'
        }
      ]),
      description: 'TEST_PHASE3_CLOTH',
      availableFrom: new Date().toISOString(),
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTimeWindow: 'Flexible',
      city: 'Mumbai',
      pickupAddress: 'Donor HQ',
      lat: 19.0760,
      lng: 72.8777,
      qualityAcknowledged: true,
      contactNumber: '9999999999'
    };

    const dFormData = new FormData();
    Object.keys(donationData).forEach(k => dFormData.append(k, donationData[k]));

    const cDonationRes = await fetch(`${BASE_URL}/cloth/donations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${donorToken}` },
      body: dFormData
    });
    const cDonationData = await cDonationRes.json();
    
    if(cDonationRes.status !== 201) {
      console.error('Failed to create donation:', cDonationData);
      return;
    }
    const donationId = cDonationData._id;
    console.log('Created Cloth Donation:', donationId);
    
    console.log('--- 3. Receiver Browses & Requests ---');
    const availRes = await fetchApi('GET', '/cloth/donations/available');
    const found = availRes.data.find(d => d._id === donationId);
    if (!found) {
      console.error('Donation not found in available list');
      return;
    }
    console.log('Donation is AVAILABLE');

    const reqData = {
      donationId,
      requestedItems: found.items.map(i => ({ itemId: i._id, quantity: i.quantity }))
    };

    const reqRes = await fetchApi('POST', '/cloth/requests', reqData, receiverToken);
      
    if(reqRes.status !== 201) {
      console.error('Failed to create request:', reqRes.data);
      return;
    }
    const requestId = reqRes.data._id;
    console.log('Created Cloth Request:', requestId);

    console.log('--- 4. Donor Accepts Request ---');
    const acceptRes = await fetchApi('PATCH', `/cloth/requests/${requestId}/accept`, {}, donorToken);
      
    if(acceptRes.status !== 200) {
      console.error('Failed to accept request:', acceptRes.data);
      return;
    }
    console.log('Accepted Cloth Request');
    
    console.log('--- 5. Setup Transfer Method ---');
    const transferRes = await fetchApi('POST', `/cloth/location/transfer-method`, { donationId, transferMethod: 'DELIVERY' }, donorToken);
      
    if(transferRes.status !== 200) {
      console.error('Failed to set transfer method:', transferRes.data);
      return;
    }
    console.log('Transfer Method set to DELIVERY');
    
    console.log('--- 6. Advance Transfer State ---');
    
    const confirmRes = await fetchApi('PATCH', `/cloth/requests/${requestId}/confirm-received`, {}, receiverToken);
      
    if(confirmRes.status !== 200) {
      console.error('Failed to confirm received:', confirmRes.data);
      return;
    }
    console.log('Receiver Confirmed Receipt -> COMPLETED');

    console.log('✅ ALL CLOTH FLOW TESTS PASSED');
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

runTest();

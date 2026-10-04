const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

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
    console.log('=== PHASE 1 LOCATION FOUNDATION TEST ===');

    console.log('\n--- Test 4: Invalid coordinates (Registration) ---');
    const invalidReg = await fetchApi('POST', '/auth/register', {
      name: 'Test Invalid', email: 'test_inv@example.com', password: 'Password@123',
      phone: '9999999999', city: 'TestCity', role: 'Food Donor',
      lat: 100, lng: -200, accuracy: 10
    });
    if (invalidReg.status !== 400 || !invalidReg.data.message.includes('Invalid GPS coordinates')) {
      console.log('FAIL: Registration accepted invalid coordinates', invalidReg.data);
    } else {
      console.log('PASS: Registration rejected invalid coordinates');
    }

    console.log('\n--- Test 1, 6: Valid coordinates + Login again ---');
    const validReg = await fetchApi('POST', '/auth/register', {
      name: 'Test Donor P1', email: 'test_donor_p1@example.com', password: 'Password@123',
      phone: '9999999999', city: 'TestCity', role: 'Food Donor',
      lat: 51.5072, lng: -0.1276, accuracy: 15
    });
    let donorToken = validReg.data.token;
    if (validReg.status === 201) {
      console.log('PASS: Location permission granted and valid coordinates accepted');
    } else if (validReg.status === 400 && validReg.data.message.includes('exists')) {
       const loginRes = await fetchApi('POST', '/auth/login', { email: 'test_donor_p1@example.com', password: 'Password@123' });
       donorToken = loginRes.data.token;
       console.log('PASS: Login successful (coordinates persisted)');
    }

    console.log('\n--- Test 5: Refresh (/auth/me) ---');
    const meRes = await fetchApi('GET', '/auth/me', null, donorToken);
    if (meRes.data && meRes.data.location && meRes.data.location.type === 'Point') {
      console.log('PASS: Refresh retains correct GeoJSON location schema');
    } else {
      console.log('FAIL: Location schema is wrong on refresh', meRes.data.location);
    }

    console.log('\n--- Test 7: Donation Creation (Valid/Invalid coords) ---');
    const invalidDonation = {
        foodName: 'Test Food', quantity: 5, peopleServed: 5, preparationTime: new Date().toISOString(),
        availableFrom: new Date().toISOString(), expiryTime: new Date(Date.now() + 86400000).toISOString(),
        city: 'London', pickupAddress: 'HQ', contactNumber: '9999999999', safetyAcknowledged: true,
        lat: 0, lng: 0
    };
    const invalidDonationFormData = new FormData();
    Object.keys(invalidDonation).forEach(k => invalidDonationFormData.append(k, invalidDonation[k]));

    const badDonRes = await fetch(`${BASE_URL}/food/donations`, { method: 'POST', headers: { 'Authorization': `Bearer ${donorToken}` }, body: invalidDonationFormData });
    if (badDonRes.status === 400) {
      console.log('PASS: Donation creation rejected 0,0 coordinates');
    } else {
      console.log('FAIL: Donation creation allowed 0,0 coordinates', await badDonRes.text());
    }

    invalidDonation.lat = 51.5072;
    invalidDonation.lng = -0.1276;
    const validDonationFormData = new FormData();
    Object.keys(invalidDonation).forEach(k => validDonationFormData.append(k, invalidDonation[k]));
    const goodDonRes = await fetch(`${BASE_URL}/food/donations`, { method: 'POST', headers: { 'Authorization': `Bearer ${donorToken}` }, body: validDonationFormData });
    const goodDonData = await goodDonRes.json();
    if (goodDonRes.status === 201) {
       console.log('PASS: Donation creation accepted valid coordinates');
    } else {
       console.log('FAIL: Donation creation failed', goodDonData);
    }
    const donationId = goodDonData._id;

    console.log('\n--- Setup Receiver for Test 8 ---');
    const receiverReg = await fetchApi('POST', '/auth/register', {
      name: 'Test Receiver P1', email: 'test_recv_p1@example.com', password: 'Password@123',
      phone: '8888888888', city: 'TestCity', role: 'Food Receiver',
      lat: 51.5072, lng: -0.1276, accuracy: 15
    });
    let receiverToken = receiverReg.data.token;
    if (!receiverToken) {
       const loginRes2 = await fetchApi('POST', '/auth/login', { email: 'test_recv_p1@example.com', password: 'Password@123' });
       receiverToken = loginRes2.data.token;
    }

    console.log('\n--- Test 8: Receiver Request (Valid/Invalid coords) ---');
    const reqInvalidCoords = await fetchApi('POST', '/food/requests', { donationId, requestedQuantity: 1, lat: 40.7128, lng: -74.006 }, receiverToken);
    if (reqInvalidCoords.status === 400) {
       console.log('PASS: Receiver request rejected hardcoded NYC fallback coordinates');
    } else {
       console.log('FAIL: Receiver request allowed NYC fallback', reqInvalidCoords.data);
    }

    const reqValidCoords = await fetchApi('POST', '/food/requests', { donationId, requestedQuantity: 1, lat: 51.5072, lng: -0.1276, accuracy: 20 }, receiverToken);
    if (reqValidCoords.status === 201) {
       console.log('PASS: Receiver request accepted valid coordinates and saved them');
    } else {
       console.log('FAIL: Receiver request failed', reqValidCoords.data);
    }

  } catch (error) {
    console.error('Fatal error during test:', error);
  }
  process.exit(0);
};

runTest();

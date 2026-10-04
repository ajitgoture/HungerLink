const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
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
    console.log('=== PHASE 2 TRANSFER ARCHITECTURE TEST ===');

    console.log('--- 1. Create Users ---');
    let dRes = await fetchApi('POST', '/auth/register', {
      name: 'Donor Phase2', email: 'donor_p2@example.com', password: 'Password@123',
      phone: '9999999999', city: 'TestCity', role: 'Food Donor', lat: 10, lng: 10, accuracy: 10
    });
    if (dRes.status !== 201) dRes = await fetchApi('POST', '/auth/login', { email: 'donor_p2@example.com', password: 'Password@123' });
    const donorToken = dRes.data.token;

    let rRes = await fetchApi('POST', '/auth/register', {
      name: 'Receiver Phase2', email: 'recv_p2@example.com', password: 'Password@123',
      phone: '8888888888', city: 'TestCity', role: 'Food Receiver', lat: 10, lng: 10, accuracy: 10
    });
    if (rRes.status !== 201) rRes = await fetchApi('POST', '/auth/login', { email: 'recv_p2@example.com', password: 'Password@123' });
    const receiverToken = rRes.data.token;

    console.log('--- 2. Create Donation ---');
    const validDonationFormData = new FormData();
    validDonationFormData.append('foodName', 'Test Phase 2');
    validDonationFormData.append('quantity', 5);
    validDonationFormData.append('peopleServed', 5);
    validDonationFormData.append('preparationTime', new Date().toISOString());
    validDonationFormData.append('availableFrom', new Date().toISOString());
    validDonationFormData.append('expiryTime', new Date(Date.now() + 86400000).toISOString());
    validDonationFormData.append('city', 'TestCity');
    validDonationFormData.append('pickupAddress', 'HQ');
    validDonationFormData.append('contactNumber', '9999999999');
    validDonationFormData.append('safetyAcknowledged', true);
    validDonationFormData.append('lat', 10);
    validDonationFormData.append('lng', 10);

    const goodDonRes = await fetch(`${BASE_URL}/food/donations`, { method: 'POST', headers: { 'Authorization': `Bearer ${donorToken}` }, body: validDonationFormData });
    const donation = await goodDonRes.json();
    const donationId = donation._id;
    console.log('Donation:', donation.status);

    console.log('--- 3. Request & Accept ---');
    const reqRes = await fetchApi('POST', '/food/requests', { donationId, requestedQuantity: 5, lat: 10, lng: 10, accuracy: 20 }, receiverToken);
    const requestId = reqRes.data._id;
    console.log('Request:', reqRes.data.status);
    
    await fetchApi('PATCH', `/food/requests/${requestId}/accept`, {}, donorToken);
    
    console.log('--- 4. Set Method (PICKUP) ---');
    const methRes = await fetchApi('POST', `/transfer/food/${donationId}/method`, { method: 'PICKUP' }, donorToken);
    console.log('Method Set:', methRes.data.status);

    console.log('--- 5. Verify Session Creation ---');
    const sessRes = await fetchApi('GET', `/food/location/session/${donationId}`, null, donorToken);
    if (sessRes.data.session) {
      console.log('Session exists:', sessRes.data.session.trackingMode, sessRes.data.session.handoverLocation);
    } else {
      console.log('FAIL: Session missing', sessRes.data);
    }

    console.log('--- 6. State Machine Flow ---');
    const t1 = await fetchApi('PATCH', `/transfer/food/${donationId}/on-the-way`, {}, receiverToken);
    console.log('Tracking:', t1.data.status || t1.data.message);

    const t2 = await fetchApi('PATCH', `/transfer/food/${donationId}/arrived`, {}, receiverToken);
    console.log('Arrived:', t2.data.status || t2.data.message);

    const t3 = await fetchApi('PATCH', `/transfer/food/${donationId}/handover`, {}, donorToken);
    console.log('Handover Ready:', t3.data.status || t3.data.message);

    console.log('--- 7. Generate & Verify Token ---');
    const tokRes = await fetchApi('GET', `/transfer/food/${donationId}/handover-token`, null, donorToken);
    const token = tokRes.data.token;
    
    const verRes = await fetchApi('POST', `/transfer/food/${donationId}/verify-handover`, { token }, receiverToken);
    console.log('Verified:', verRes.data.message || verRes.data);

    const compRes = await fetchApi('PATCH', `/transfer/food/${donationId}/complete`, {}, donorToken);
    console.log('Complete:', compRes.data.status || compRes.data.message);

  } catch (error) {
    console.error('Fatal error during test:', error);
  }
  process.exit(0);
};

runTest();

const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

async function verifyPhase6Acceptance() {
  console.log('--- PHASE 6 ACCEPTANCE TEST ---');

  // SETUP
  const donorRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Acceptance Donor', email: `acc_donor${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Food Donor', phone: '1112223334', address: '123 Test St', city: 'Test City', location: { lat: 10, lng: 10 }
  });
  const donorAuth = { headers: { Authorization: `Bearer ${donorRes.data.token}` } };
  
  const receiverRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Acceptance Receiver', email: `acc_receiver${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Food Receiver', phone: '5556667778', address: '456 Test St', city: 'Test City', location: { lat: 11, lng: 11 }
  });
  const receiverAuth = { headers: { Authorization: `Bearer ${receiverRes.data.token}` } };
  const receiverId = receiverRes.data._id;
  const donorId = donorRes.data._id;

  // TEST 1: No completed transaction -> No pending rating
  const p1 = await axios.get(`${BASE_URL}/reviews/pending`, donorAuth);
  console.log('TEST 1 (No Transaction):', p1.data.length === 0 ? 'PASS' : 'FAIL');

  // TEST 2: Create a real food transaction
  const fRes = await axios.post(`${BASE_URL}/food/donations`, {
    title: 'Food Test', foodName: 'Pizza', quantity: 5, unit: 'pieces', peopleServed: 5,
    preparationTime: new Date(), availableFrom: new Date(), expiryTime: new Date(Date.now() + 864000),
    city: 'Test City', pickupAddress: 'Test Address', contactNumber: '1234567890', safetyAcknowledged: true,
    approximateLocation: { lat: 10, lng: 10, address: 'Test' }, preciseLocation: { lat: 10, lng: 10, address: 'Test' }
  }, donorAuth);
  const fId = fRes.data._id;

  const fReqRes = await axios.post(`${BASE_URL}/food/requests`, { donationId: fId, requestedQuantity: 5 }, receiverAuth);
  const fReqId = fReqRes.data._id;
  await axios.patch(`${BASE_URL}/food/requests/${fReqId}/accept`, {}, donorAuth);

  // TEST 7: Accepted but NOT completed -> Rating must NOT appear
  const p7 = await axios.get(`${BASE_URL}/reviews/pending`, donorAuth);
  console.log('TEST 7 (Accepted but NOT completed):', p7.data.length === 0 ? 'PASS' : 'FAIL');

  // Proceed to complete Food Transaction
  await axios.post(`${BASE_URL}/transfer/food/${fId}/method`, { method: 'PICKUP' }, donorAuth);
  await axios.patch(`${BASE_URL}/transfer/food/${fId}/on-the-way`, {}, receiverAuth);
  await axios.patch(`${BASE_URL}/transfer/food/${fId}/arrived`, {}, receiverAuth);
  await axios.patch(`${BASE_URL}/transfer/food/${fId}/handover`, {}, donorAuth);
  const qrRes = await axios.get(`${BASE_URL}/transfer/food/${fId}/handover-token`, donorAuth);
  await axios.post(`${BASE_URL}/transfer/food/${fId}/verify-handover`, { token: qrRes.data.token }, receiverAuth);
  await axios.patch(`${BASE_URL}/food/requests/${fReqId}/confirm-received`, {}, receiverAuth);

  // Check Eligibility
  const p2 = await axios.get(`${BASE_URL}/reviews/pending`, donorAuth);
  console.log('TEST 2 (Eligibility after Completion):', p2.data.some(d => d._id === fId) ? 'PASS' : 'FAIL');

  // TEST 3 & 4: Submit Ratings
  await axios.post(`${BASE_URL}/reviews/submit`, { donationId: fId, moduleType: 'food', rating: 5, revieweeId: donorId }, receiverAuth);
  console.log('TEST 3 (Receiver Rates Donor): PASS');
  await axios.post(`${BASE_URL}/reviews/submit`, { donationId: fId, moduleType: 'food', rating: 4, revieweeId: receiverId }, donorAuth);
  console.log('TEST 4 (Donor Rates Receiver): PASS');

  // TEST 5 & 8: Refresh - Must not ask again
  const p5_donor = await axios.get(`${BASE_URL}/reviews/pending`, donorAuth);
  const p5_recv = await axios.get(`${BASE_URL}/reviews/pending`, receiverAuth);
  console.log('TEST 5/8 (Refresh / Already Rated):', (p5_donor.data.length === 0 && p5_recv.data.length === 0) ? 'PASS' : 'FAIL');

  // TEST 6: Clothing Transaction
  const cdRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Cloth Donor', email: `c_donor${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Cloth Donor', phone: '1112223334', address: '123 Test St', city: 'Test City', location: { lat: 10, lng: 10 }
  });
  const crRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Cloth Receiver', email: `c_receiver${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Cloth Receiver', phone: '5556667778', address: '456 Test St', city: 'Test City', location: { lat: 11, lng: 11 }
  });
  const cdAuth = { headers: { Authorization: `Bearer ${cdRes.data.token}` } };
  const crAuth = { headers: { Authorization: `Bearer ${crRes.data.token}` } };
  
  const cRes = await axios.post(`${BASE_URL}/cloth/donations`, {
    clothingCategory: 'Men', clothingType: 'Shirt', condition: 'Good',
    availableFrom: new Date(), city: 'Test City', pickupAddress: 'Test Address',
    contactNumber: '1234567890', qualityAcknowledged: true,
    items: [ { recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 2, condition: 'Good' } ],
    approximateLocation: { lat: 10, lng: 10, address: 'Test' },
    preciseLocation: { lat: 10, lng: 10, address: 'Test' }
  }, cdAuth);
  const cId = cRes.data._id;

  const cReqRes = await axios.post(`${BASE_URL}/cloth/requests`, { donationId: cId, requestedQuantity: 2 }, crAuth);
  const cReqId = cReqRes.data._id;
  await axios.patch(`${BASE_URL}/cloth/requests/${cReqId}/accept`, {}, cdAuth);
  await axios.post(`${BASE_URL}/transfer/cloth/${cId}/method`, { method: 'PICKUP' }, cdAuth);
  await axios.patch(`${BASE_URL}/transfer/cloth/${cId}/on-the-way`, {}, crAuth);
  await axios.patch(`${BASE_URL}/transfer/cloth/${cId}/arrived`, {}, crAuth);
  await axios.patch(`${BASE_URL}/transfer/cloth/${cId}/handover`, {}, cdAuth);
  const qrCRes = await axios.get(`${BASE_URL}/transfer/cloth/${cId}/handover-token`, cdAuth);
  await axios.post(`${BASE_URL}/transfer/cloth/${cId}/verify-handover`, { token: qrCRes.data.token }, crAuth);
  await axios.patch(`${BASE_URL}/cloth/requests/${cReqId}/confirm-received`, {}, crAuth);

  const pc2 = await axios.get(`${BASE_URL}/reviews/pending`, cdAuth);
  console.log('TEST 6 (Clothing Verify Elegibility):', pc2.data.some(d => d._id === cId) ? 'PASS' : 'FAIL');

  // TEST 10: Session Isolation
  const randomRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Random User', email: `rand_${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Food Donor', phone: '1112223334', address: '123 Test St', city: 'Test City', location: { lat: 10, lng: 10 }
  });
  const randomAuth = { headers: { Authorization: `Bearer ${randomRes.data.token}` } };
  const p10 = await axios.get(`${BASE_URL}/reviews/pending`, randomAuth);
  console.log('TEST 10 (Session Isolation):', p10.data.length === 0 ? 'PASS' : 'FAIL');

  console.log('--- ALL ACCEPTANCE TESTS COMPLETE ---');
}

verifyPhase6Acceptance().catch(console.error);

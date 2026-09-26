const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

async function verifyRatingSubmit() {
  console.log('--- PHASE 5 RATING SUBMIT END-TO-END TEST ---');

  // 1. Create a donor & receiver
  const donorRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Rating Donor', email: `ratingdonor${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Food Donor', phone: '1112223334', address: '123 Test St', city: 'Test City',
    location: { lat: 10, lng: 10 }
  });
  const donorToken = donorRes.data.token;
  const donorAuth = { headers: { Authorization: `Bearer ${donorToken}` } };

  const receiverRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Rating Receiver', email: `ratingreceiver${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Food Receiver', phone: '5556667778', address: '456 Test St', city: 'Test City',
    location: { lat: 11, lng: 11 }
  });
  const receiverToken = receiverRes.data.token;
  const receiverAuth = { headers: { Authorization: `Bearer ${receiverToken}` } };
  const receiverId = receiverRes.data._id;

  // 2. Create food donation
  const foodRes = await axios.post(`${BASE_URL}/food/donations`, {
    title: 'E2E Food',
    foodName: 'Apples',
    quantity: 50,
    unit: 'pieces',
    peopleServed: 10,
    preparationTime: new Date(),
    availableFrom: new Date(),
    expiryTime: new Date(Date.now() + 86400000),
    city: 'Test City',
    pickupAddress: 'Test Address',
    contactNumber: '1234567890',
    safetyAcknowledged: true,
    approximateLocation: { lat: 10, lng: 10, address: 'Test City' },
    preciseLocation: { lat: 10, lng: 10, address: 'Exact Address 123' },
    foodItems: [{ foodName: 'Apples', quantity: 50, unit: 'pieces', expiryTime: new Date(Date.now() + 86400000) }]
  }, donorAuth);
  const donationId = foodRes.data._id;
  console.log('Donation created:', donationId);

  // 3. Request
  const reqRes = await axios.post(`${BASE_URL}/food/requests`, { donationId, requestedQuantity: 5 }, receiverAuth);
  const requestId = reqRes.data._id;

  // 4. Accept
  await axios.patch(`${BASE_URL}/food/requests/${requestId}/accept`, {}, donorAuth);

  // 5. Handover
  await axios.post(`${BASE_URL}/transfer/food/${donationId}/method`, { method: 'PICKUP' }, donorAuth);
  await axios.patch(`${BASE_URL}/transfer/food/${donationId}/on-the-way`, {}, receiverAuth);
  await axios.patch(`${BASE_URL}/transfer/food/${donationId}/arrived`, {}, receiverAuth);
  await axios.patch(`${BASE_URL}/transfer/food/${donationId}/handover`, {}, donorAuth);
  
  const fQrRes = await axios.get(`${BASE_URL}/transfer/food/${donationId}/handover-token`, donorAuth);
  await axios.post(`${BASE_URL}/transfer/food/${donationId}/verify-handover`, { token: fQrRes.data.token }, receiverAuth);
  
  await axios.patch(`${BASE_URL}/food/requests/${requestId}/confirm-received`, {}, receiverAuth);

  console.log('Transaction Completed');

  // 6. Test Error: 422 Validation
  try {
    await axios.post(`${BASE_URL}/reviews/submit`, {
      donationId, moduleType: 'food', revieweeId: receiverId
    }, donorAuth);
    console.log('FAIL: Missing rating allowed');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 422) {
      console.log('PASS: 422 Validation caught for missing rating');
    } else {
      console.log('FAIL: Expected 422, got', err.response?.status);
      process.exit(1);
    }
  }

  // 7. Test Error: 403 Participant
  const strangerRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Stranger', email: `stranger${Date.now()}@test.com`, password: 'Test@12345',
    role: 'Food Donor', phone: '9998887776', address: '123 Test St', city: 'Test City',
    location: { lat: 10, lng: 10 }
  });
  const strangerAuth = { headers: { Authorization: `Bearer ${strangerRes.data.token}` } };
  try {
    await axios.post(`${BASE_URL}/reviews/submit`, {
      donationId, moduleType: 'food', rating: 5, revieweeId: receiverId
    }, strangerAuth);
    console.log('FAIL: Stranger allowed to rate');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('PASS: 403 Participant validation caught');
    } else {
      console.log('FAIL: Expected 403, got', err.response?.status);
      process.exit(1);
    }
  }

  // 8. Test Error: 404 Donation
  try {
    await axios.post(`${BASE_URL}/reviews/submit`, {
      donationId: new mongoose.Types.ObjectId().toString(), moduleType: 'food', rating: 5, revieweeId: receiverId
    }, donorAuth);
    console.log('FAIL: Fake donation allowed');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('PASS: 404 Not Found caught');
    } else {
      console.log('FAIL: Expected 404, got', err.response?.status);
      process.exit(1);
    }
  }

  // 9. Check Pending Reviews before submitting (Mocking Refresh test setup)
  const pendingBefore = await axios.get(`${BASE_URL}/reviews/pending`, donorAuth);
  if (pendingBefore.data.find(d => d._id === donationId)) {
    console.log('PASS: Pending rating appears in /api/reviews/pending');
  } else {
    console.log('FAIL: Pending rating NOT found');
    process.exit(1);
  }

  // 10. Test Success: Store Rating Correctly
  const submitRes = await axios.post(`${BASE_URL}/reviews/submit`, {
    donationId, moduleType: 'food', rating: 4, comment: 'Very prompt!', revieweeId: receiverId
  }, donorAuth);
  if (submitRes.data.message === 'Review submitted successfully') {
    console.log('PASS: Rating correctly saved');
  }

  // 11. Test Error: 409 Duplicate
  try {
    await axios.post(`${BASE_URL}/reviews/submit`, {
      donationId, moduleType: 'food', rating: 5, revieweeId: receiverId
    }, donorAuth);
    console.log('FAIL: Duplicate rating allowed');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('PASS: 409 Duplicate rating caught');
    } else {
      console.log('FAIL: Expected 409, got', err.response?.status);
      process.exit(1);
    }
  }

  // 12. Refresh Test (Check pending reviews again)
  const pendingAfter = await axios.get(`${BASE_URL}/reviews/pending`, donorAuth);
  if (!pendingAfter.data.find(d => d._id === donationId)) {
    console.log('PASS: Pending rating disappeared after successful submission (Refresh Test)');
  } else {
    console.log('FAIL: Pending rating still exists!');
    process.exit(1);
  }

  console.log('--- ALL RATING SUBMISSION TESTS PASSED ---');
}

verifyRatingSubmit().catch(e => {
  console.log('SCRIPT ERROR:', e);
});

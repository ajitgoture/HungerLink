const axios = require('axios');
axios.defaults.timeout = 15000;

const BASE_URL = 'http://localhost:5000/api';
let donorToken, receiverToken, attackerToken;
let donorId, receiverId, attackerId;

async function runTests() {
  try {
    console.log('--- STARTING PHASE 9 E2E TESTS ---');
    
    // 1. Setup Users
    console.log('Registering Test Users...');
    const dRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Donor', email: `donor_${Date.now()}@test.com`, password: 'Password@123', role: 'Food Donor', phone: '1234567890', city: 'Test City', address: '123 Test St' });
    const rRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Receiver', email: `receiver_${Date.now()}@test.com`, password: 'Password@123', role: 'Food Receiver', phone: '0987654321', city: 'Test City', address: '123 Test St' });
    const aRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Attacker', email: `attacker_${Date.now()}@test.com`, password: 'Password@123', role: 'Food Receiver', phone: '1111111111', city: 'Test City', address: '123 Test St' });
    const cdRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Cloth Donor', email: `cdonor_${Date.now()}@test.com`, password: 'Password@123', role: 'Cloth Donor', phone: '1234567890', city: 'Test City', address: '123 Test St' });
    const crRes = await axios.post(`${BASE_URL}/auth/register`, { name: 'E2E Cloth Receiver', email: `creceiver_${Date.now()}@test.com`, password: 'Password@123', role: 'Cloth Receiver', phone: '0987654321', city: 'Test City', address: '123 Test St' });
    const cDonorAuth = { headers: { Authorization: `Bearer ${cdRes.data.token}` } };
    const cReceiverAuth = { headers: { Authorization: `Bearer ${crRes.data.token}` } };
    
    donorToken = dRes.data.token; donorId = dRes.data._id;
    receiverToken = rRes.data.token; receiverId = rRes.data._id;
    attackerToken = aRes.data.token; attackerId = aRes.data._id;
    
    const donorAuth = { headers: { Authorization: `Bearer ${donorToken}` } };
    const receiverAuth = { headers: { Authorization: `Bearer ${receiverToken}` } };
    const attackerAuth = { headers: { Authorization: `Bearer ${attackerToken}` } };

    // =================================================================
    // FOOD TEST
    // =================================================================
    console.log('\n--- FOOD FLOW ---');
    // Create Food
    const fDonRes = await axios.post(`${BASE_URL}/food/donations`, {
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
    const foodDonationId = fDonRes.data._id;
    console.log('Food Created:', foodDonationId, fDonRes.data.status);

    // Receiver requests partial quantity
    const fReqRes = await axios.post(`${BASE_URL}/food/requests`, {
      donationId: foodDonationId,
      requestedQuantity: 20
    }, receiverAuth);
    console.log('Food Requested. Quantity:', fReqRes.data.requestedQuantity);
    
    // Attacker tries to accept
    try {
      await axios.patch(`${BASE_URL}/food/requests/${fReqRes.data._id}/accept`, {}, attackerAuth);
      console.error('FAIL: Attacker could accept request');
    } catch (e) {
      console.log('PASS: Attacker blocked from accepting');
    }

    // Donor accepts
    const fAccRes = await axios.patch(`${BASE_URL}/food/requests/${fReqRes.data._id}/accept`, {}, donorAuth);
    console.log('Food Accepted. Status:', fAccRes.data.donation.status);

    // Verify Invalid Flow: REQUESTED -> QR_VERIFIED (Skipping states)
    try {
      await axios.post(`${BASE_URL}/transfer/food/${foodDonationId}/verify-handover`, { token: '123456' }, receiverAuth);
      console.error('FAIL: Skipped to QR verification');
    } catch (e) {
      console.log('PASS: Invalid transition blocked (QR verify when ACCEPTED)');
    }

    // Ready for Handover
    await axios.post(`${BASE_URL}/transfer/food/${foodDonationId}/method`, { method: 'PICKUP' }, donorAuth);
    console.log('Food Ready for Pickup');

    // Initiate Handover
    await axios.patch(`${BASE_URL}/transfer/food/${foodDonationId}/handover`, {}, donorAuth);
    console.log('Food Handover Initiated');

    // QR Generation (Donor)
    const fQrRes = await axios.get(`${BASE_URL}/transfer/food/${foodDonationId}/handover-token`, donorAuth);
    console.log('Food QR Generated');
    
    // QR Verify (Receiver)
    await axios.post(`${BASE_URL}/transfer/food/${foodDonationId}/verify-handover`, { token: fQrRes.data.token }, receiverAuth);
    console.log('Food QR Verified');

    // Complete (Receiver)
    await axios.patch(`${BASE_URL}/transfer/food/${foodDonationId}/complete`, {}, receiverAuth);
    console.log('Food Completed');

    // Verify Quantity
    const fFinalDonation = await axios.get(`${BASE_URL}/food/donations/${foodDonationId}`, donorAuth);
    console.log('Food Final Quantity:', fFinalDonation.data.quantity, 'Status:', fFinalDonation.data.status);

    const foodReceiverReview = await axios.post(`${BASE_URL}/reviews/submit`, { donationId: foodDonationId, moduleType: 'food', rating: 5, comment: 'Great donor' }, receiverAuth);
    console.log('Food Receiver Rating:', foodReceiverReview.status);
    
    // =================================================================
    // CLOTHES TEST
    // =================================================================
    console.log('\n--- CLOTHES FLOW ---');
    // Create Cloth
    const cDonRes = await axios.post(`${BASE_URL}/cloth/donations`, {
      clothingCategory: 'Men',
      clothingType: 'Shirt',
      condition: 'Good',
      availableFrom: new Date(),
      city: 'Test City',
      pickupAddress: 'Test Address',
      contactNumber: '1234567890',
      qualityAcknowledged: true,
      items: [
        { recipientCategory: 'Men', type: 'Shirt', size: 'M', quantity: 3, condition: 'Good' },
        { recipientCategory: 'Men', type: 'Pants', size: '32', quantity: 2, condition: 'Good' }
      ],
      approximateLocation: { lat: 10, lng: 10, address: 'Test City' },
      preciseLocation: { lat: 10, lng: 10, address: 'Exact Address 123' }
    }, cDonorAuth);
    const clothDonationId = cDonRes.data._id;
    const shirtItemId = cDonRes.data.items[0]._id;
    console.log('Cloth Created:', clothDonationId);

    // Receiver requests 1 shirt
    const cReqRes = await axios.post(`${BASE_URL}/cloth/requests`, {
      donationId: clothDonationId,
      requestedItems: [{ itemId: shirtItemId, quantity: 1 }]
    }, cReceiverAuth);
    console.log('Cloth Requested.');
    
    // Donor accepts
    await axios.patch(`${BASE_URL}/cloth/requests/${cReqRes.data._id}/accept`, {}, cDonorAuth);
    console.log('Cloth Accepted');

    // Ready for Handover
    await axios.post(`${BASE_URL}/transfer/cloth/${clothDonationId}/method`, { method: 'PICKUP' }, cDonorAuth);
    
    // Initiate Handover
    await axios.patch(`${BASE_URL}/transfer/cloth/${clothDonationId}/handover`, {}, cDonorAuth);

    // QR Generation
    const cQrRes = await axios.get(`${BASE_URL}/transfer/cloth/${clothDonationId}/handover-token`, cDonorAuth);
    
    // QR Verify
    await axios.post(`${BASE_URL}/transfer/cloth/${clothDonationId}/verify-handover`, { token: cQrRes.data.token }, cReceiverAuth);
    
    // Complete
    await axios.patch(`${BASE_URL}/transfer/cloth/${clothDonationId}/complete`, {}, cReceiverAuth);
    console.log('Cloth Completed');

    // Verify Quantity
    const cFinalDonation = await axios.get(`${BASE_URL}/cloth/donations/${clothDonationId}`, cDonorAuth);
    const remainingShirt = cFinalDonation.data.items.find(i => i._id.toString() === shirtItemId.toString());
    console.log('Cloth Final Shirt Quantity:', remainingShirt.quantity, 'Donation Status:', cFinalDonation.data.status);
    
    // Ratings
    const clothReceiverReview = await axios.post(`${BASE_URL}/reviews/submit`, { donationId: clothDonationId, moduleType: 'cloth', rating: 5, comment: 'Nice cloth' }, cReceiverAuth);
    console.log('Cloth Receiver Rating:', clothReceiverReview.status);
    
    console.log('\n--- ALL E2E TESTS PASSED ---');
  } catch (err) {
    console.error('TEST ERROR:', err.response ? err.response.data : err.message);
  }
}

runTests();

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const FoodDonation = require('./models/FoodDonation');
const ClothDonation = require('./models/ClothDonation');
const FoodRequest = require('./models/FoodRequest');
const ClothRequest = require('./models/ClothRequest');
const { 
  setTransferMethod, 
  markArrived, 
  initiateHandover, 
  completeTransfer, 
  generateHandoverToken, 
  verifyHandoverToken 
} = require('./controllers/transferController');
const { createRequest: createFoodRequest, acceptRequest: acceptFoodReq } = require('./controllers/foodRequestController');
const { createClothRequest, acceptClothRequest } = require('./controllers/clothRequestController');

// Mock request/response objects
const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

const runTest = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const donor = await User.findOne({ role: 'donor' });
  const receiver = await User.findOne({ role: 'receiver' });
  
  if (!donor || !receiver) throw new Error('Need donor and receiver');
  console.log(`Donor: ${donor.name}, Receiver: ${receiver.name}`);

  // Test 1: Food Lifecycle
  console.log('\n--- TESTING FOOD TRANSITION ---');
  let food = new FoodDonation({
    donor: donor._id,
    foodName: 'Test Food',
    foodType: 'Vegetarian',
    quantity: 5,
    unit: 'plates',
    peopleServed: 5,
    availableFrom: new Date(),
    responseDeadline: new Date(Date.now() + 3600000),
    preparationTime: new Date(),
    expiryTime: new Date(Date.now() + 86400000),
    status: 'AVAILABLE',
    approximateLocation: { city: 'Belagavi', lat: 15.85, lng: 74.5 },
    preciseLocation: { address: 'Test Address', lat: 15.85, lng: 74.5 },
    location: { type: 'Point', coordinates: [74.5, 15.85] },
    contactNumber: '9999999999',
    imageUrl: 'test.jpg'
  });
  await food.save();
  console.log('Created Food:', food.status);

  // REQUEST
  const reqCreateFood = { user: { _id: receiver._id }, body: { donationId: food._id.toString(), requestedQuantity: 2 }, app: { get: () => null } };
  const resCreateFood = mockRes();
  await createFoodRequest(reqCreateFood, resCreateFood);
  if (resCreateFood.statusCode === 400) throw new Error(resCreateFood.data?.message || 'Food request failed');
  console.log('Food Requested. Donation Status:', (await FoodDonation.findById(food._id)).status);

  const request = await FoodRequest.findOne({ donation: food._id });
  
  // ACCEPT
  const reqAcceptFood = { user: { _id: donor._id }, params: { id: request._id.toString() }, app: { get: () => null } };
  const resAcceptFood = mockRes();
  await acceptFoodReq(reqAcceptFood, resAcceptFood);
  console.log('Food Accepted. Status:', (await FoodDonation.findById(food._id)).status);

  // TRANSFER METHOD (Donor selects DELIVERY)
  const reqMethod = { user: { _id: donor._id }, params: { moduleType: 'food', donationId: food._id.toString() }, body: { method: 'DELIVERY' }, app: { get: () => null } };
  const resMethod = mockRes();
  await setTransferMethod(reqMethod, resMethod);
  console.log('Transfer Method Set. Status:', (await FoodDonation.findById(food._id)).status);

  // ARRIVED (Donor arrives because DELIVERY)
  const reqArrive = { user: { _id: donor._id }, params: { moduleType: 'food', donationId: food._id.toString() }, app: { get: () => null } };
  const resArrive = mockRes();
  await markArrived(reqArrive, resArrive);
  console.log('Arrived. Status:', (await FoodDonation.findById(food._id)).status);

  // HANDOVER INITIATED (Donor)
  const reqHandover = { user: { _id: donor._id }, params: { moduleType: 'food', donationId: food._id.toString() }, app: { get: () => null } };
  const resHandover = mockRes();
  await initiateHandover(reqHandover, resHandover);
  console.log('Handover Initiated. Status:', (await FoodDonation.findById(food._id)).status);
  
  // QR GENERATE (Donor)
  const reqQR = { user: { _id: donor._id }, params: { moduleType: 'food', donationId: food._id.toString() }, app: { get: () => null } };
  const resQR = mockRes();
  await generateHandoverToken(reqQR, resQR);
  console.log('QR Generated:', resQR.data.token);

  // QR VERIFY (Receiver)
  const reqVerify = { user: { _id: receiver._id }, params: { moduleType: 'food', donationId: food._id.toString() }, body: { token: resQR.data.token }, app: { get: () => null } };
  const resVerify = mockRes();
  await verifyHandoverToken(reqVerify, resVerify);
  console.log('QR Verified:', (await FoodDonation.findById(food._id)).handoverVerified);

  // COMPLETE (Receiver/Auto)
  const reqComplete = { user: { _id: receiver._id }, params: { moduleType: 'food', donationId: food._id.toString() }, body: {}, app: { get: () => null } };
  const resComplete = mockRes();
  await completeTransfer(reqComplete, resComplete);
  console.log('Completed. Status:', (await FoodDonation.findById(food._id)).status);


  // Test 2: Cloth Lifecycle
  console.log('\n--- TESTING CLOTH TRANSITION ---');
  let cloth = new ClothDonation({
    donor: donor._id,
    title: 'Test Shirts',
    items: [{
      recipientCategory: 'Men',
      type: 'Shirt',
      size: 'L',
      quantity: 5,
      condition: 'Good'
    }],
    city: 'Belagavi',
    location: { type: 'Point', coordinates: [74.5, 15.85] },
    approximateLocation: { city: 'Belagavi', lat: 15.85, lng: 74.5 },
    preciseLocation: { address: 'Test Address', lat: 15.85, lng: 74.5 },
    contactNumber: '9999999999',
    availableFrom: new Date(),
    status: 'AVAILABLE'
  });
  await cloth.save();
  console.log('Created Cloth:', cloth.status);

  // REQUEST
  const reqCreateCloth = { user: { _id: receiver._id }, body: { donationId: cloth._id.toString() }, app: { get: () => null } };
  const resCreateCloth = mockRes();
  await createClothRequest(reqCreateCloth, resCreateCloth);
  if (resCreateCloth.statusCode === 400) throw new Error(resCreateCloth.data?.message || 'Cloth request failed');
  console.log('Cloth Requested. Donation Status:', (await ClothDonation.findById(cloth._id)).status);

  const requestCloth = await ClothRequest.findOne({ donation: cloth._id });
  
  // ACCEPT
  const reqAcceptCloth = { user: { _id: donor._id }, params: { id: requestCloth._id.toString() }, app: { get: () => null } };
  const resAcceptCloth = mockRes();
  await acceptClothRequest(reqAcceptCloth, resAcceptCloth);
  console.log('Cloth Accepted. Status:', (await ClothDonation.findById(cloth._id)).status);

  // TRANSFER METHOD (Donor selects PICKUP)
  const reqMethodCloth = { user: { _id: donor._id }, params: { moduleType: 'cloth', donationId: cloth._id.toString() }, body: { method: 'PICKUP' }, app: { get: () => null } };
  const resMethodCloth = mockRes();
  await setTransferMethod(reqMethodCloth, resMethodCloth);
  console.log('Transfer Method Set. Status:', (await ClothDonation.findById(cloth._id)).status);

  // ARRIVED (Receiver arrives because PICKUP)
  const reqArriveCloth = { user: { _id: receiver._id }, params: { moduleType: 'cloth', donationId: cloth._id.toString() }, app: { get: () => null } };
  const resArriveCloth = mockRes();
  await markArrived(reqArriveCloth, resArriveCloth);
  console.log('Arrived. Status:', (await ClothDonation.findById(cloth._id)).status);

  // TEST INVALID TRANSITION (Receiver tries to initiate handover)
  const reqHandoverClothFail = { user: { _id: receiver._id }, params: { moduleType: 'cloth', donationId: cloth._id.toString() }, app: { get: () => null } };
  const resHandoverClothFail = mockRes();
  await initiateHandover(reqHandoverClothFail, resHandoverClothFail);
  if (resHandoverClothFail.statusCode === 403) {
    console.log('Successfully rejected Receiver initiating handover (Security Check Passed)');
  } else {
    throw new Error('Security check failed! Receiver initiated handover.');
  }

  // HANDOVER INITIATED (Donor)
  const reqHandoverCloth = { user: { _id: donor._id }, params: { moduleType: 'cloth', donationId: cloth._id.toString() }, app: { get: () => null } };
  const resHandoverCloth = mockRes();
  await initiateHandover(reqHandoverCloth, resHandoverCloth);
  console.log('Handover Initiated. Status:', (await ClothDonation.findById(cloth._id)).status);
  
  // COMPLETE with Fallback (Donor)
  const reqCompleteCloth = { user: { _id: donor._id }, params: { moduleType: 'cloth', donationId: cloth._id.toString() }, body: { fallbackReason: 'No phone' }, app: { get: () => null } };
  const resCompleteCloth = mockRes();
  await completeTransfer(reqCompleteCloth, resCompleteCloth);
  console.log('Completed. Status:', (await ClothDonation.findById(cloth._id)).status);
  
  console.log('\nALL TESTS PASSED SUCCESSFULLY');
  process.exit();
};
runTest().catch(err => { console.error('TEST FAILED:', err); process.exit(1); });

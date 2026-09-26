const axios = require('axios');
const FormData = require('form-data');

async function testSubmit() {
  try {
    const testEmail = 'testdonor_' + Date.now() + '@example.com';
    const regRes = await axios.post('http://127.0.0.1:5000/api/auth/register', {
      name: 'Test Donor',
      email: testEmail,
      password: 'Password@123',
      phone: '1234567890',
      city: 'Test City',
      role: 'Food Donor'
    });
    const token = regRes.data.token;

    const fd = new FormData();
    fd.append('availableFrom', '2026-10-22T16:00');
    fd.append('city', 'Test City');
    fd.append('area', 'Test Area');
    fd.append('pickupAddress', '123 Test St');
    fd.append('lat', '40.7128');
    fd.append('lng', '-74.006');
    fd.append('contactNumber', '1234567890');
    fd.append('packaging', 'Packed');
    fd.append('storageCondition', 'Room Temperature');
    fd.append('safetyAcknowledged', 'true');

    // First item fallbacks
    fd.append('foodName', 'Chapati');
    fd.append('foodType', 'Vegetarian');
    fd.append('quantity', '50');
    fd.append('unit', 'Pieces');
    fd.append('peopleServed', '25');
    fd.append('description', '');

    const foodItems = [
      {
        foodName: 'Chapati',
        foodType: 'Vegetarian',
        quantity: '50',
        unit: 'Pieces',
        peopleServed: '25',
        description: '',
        preparationTime: '2026-10-22T14:00',
        expiryTime: '2026-10-22T20:00'
      },
      {
        foodName: 'Dal',
        foodType: 'Vegetarian',
        quantity: '5',
        unit: 'Litres',
        peopleServed: '25',
        description: '',
        preparationTime: '2026-10-22T15:00',
        expiryTime: '2026-10-22T21:00'
      }
    ];

    fd.append('foodItems', JSON.stringify(foodItems));

    const res = await axios.post('http://127.0.0.1:5000/api/food/donations', fd, {
      headers: {
        ...fd.getHeaders(),
        Authorization: 'Bearer ' + token
      }
    });

    console.log('Success:', res.status);
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err.message);
  }
}

testSubmit();

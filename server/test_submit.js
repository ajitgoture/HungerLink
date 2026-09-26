const FormData = require('form-data'); // using node-fetch or native fetch with node FormData is tricky, let's just stick to native fetch

async function runTest() {
  try {
    const testEmail = 'testdonor_' + Date.now() + '@example.com';
    const regRes = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Donor',
        email: testEmail,
        password: 'Password@123',
        phone: '1234567890',
        city: 'Test City',
        role: 'Food Donor'
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(JSON.stringify(regData));
    const token = regData.token;
    console.log('Registered and got token:', token.substring(0, 20) + '...');

    // Use native FormData if possible, but Node's native FormData is tricky.
    // Let's use the form-data library
    const fd = new FormData();
    
    // Shared / non-item fields
    fd.append('availableFrom', '2026-10-22T16:00'); // 4 PM
    fd.append('city', 'Test City');
    fd.append('area', 'Test Area');
    fd.append('pickupAddress', '123 Test St');
    fd.append('lat', '40.7128');
    fd.append('lng', '-74.006');
    fd.append('contactNumber', '1234567890');
    fd.append('packaging', 'Packed');
    fd.append('storageCondition', 'Room Temperature');
    fd.append('safetyAcknowledged', 'true');

    // First item fields (backward-compatible)
    fd.append('foodName', 'Chapati');
    fd.append('foodType', 'Vegetarian');
    fd.append('quantity', '50');
    fd.append('unit', 'Pieces');
    fd.append('peopleServed', '25');
    fd.append('description', '');
    fd.append('preparationTime', '2026-10-22T14:00'); // 2 PM
    fd.append('expiryTime', '2026-10-22T20:00'); // 8 PM

    // All items as JSON array
    const serializedItems = [
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
        preparationTime: '2026-10-22T15:00', // 3 PM
        expiryTime: '2026-10-22T21:00' // 9 PM
      }
    ];
    fd.append('foodItems', JSON.stringify(serializedItems));

    console.log('Sending donation payload...');
    const res = await fetch('http://127.0.0.1:5000/api/food/donations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        // don't set Content-Type manually, fetch does not handle form-data library boundaries automatically.
        // Wait, native fetch + form-data package requires setting the boundary.
        ...fd.getHeaders()
      },
      body: fd
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

runTest();

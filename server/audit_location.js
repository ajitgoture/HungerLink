// Location System End-to-End Audit Script
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://suds_user:Ajit4602@cluster0.hahyxek.mongodb.net/?appName=Cluster0';

async function runAudit() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas\n');

  const FoodDonation = require('../../server/models/FoodDonation');
  const ClothDonation = require('../../server/models/ClothDonation');

  const totalFood = await FoodDonation.countDocuments();
  const totalCloth = await ClothDonation.countDocuments();
  console.log('TOTAL FOOD DONATIONS:', totalFood);
  console.log('TOTAL CLOTH DONATIONS:', totalCloth, '\n');

  // NYC contaminated food donations
  const nycFood = await FoodDonation.find(
    { $or: [{ 'approximateLocation.lat': 40.7128 }, { 'approximateLocation.lng': -74.006 }] },
    '_id foodName status approximateLocation location createdAt'
  ).lean();

  console.log('NYC-CONTAMINATED FOOD DONATIONS:', nycFood.length);
  nycFood.forEach(d => console.log(JSON.stringify({
    id: d._id, food: d.foodName, status: d.status,
    city: d.approximateLocation?.city, lat: d.approximateLocation?.lat,
    lng: d.approximateLocation?.lng, coords: d.location?.coordinates
  })));

  // NYC contaminated cloth donations
  const nycCloth = await ClothDonation.find(
    { $or: [{ 'approximateLocation.lat': 40.7128 }, { 'approximateLocation.lng': -74.006 }] },
    '_id status approximateLocation location createdAt'
  ).lean();

  console.log('\nNYC-CONTAMINATED CLOTH DONATIONS:', nycCloth.length);
  nycCloth.forEach(d => console.log(JSON.stringify({
    id: d._id, status: d.status,
    city: d.approximateLocation?.city, lat: d.approximateLocation?.lat,
    lng: d.approximateLocation?.lng, coords: d.location?.coordinates
  })));

  // Latest 5 food donations — verify real coords
  const recentFood = await FoodDonation.find(
    {}, '_id foodName status approximateLocation location createdAt'
  ).sort({ createdAt: -1 }).limit(5).lean();

  console.log('\nMOST RECENT 5 FOOD DONATIONS:');
  recentFood.forEach(d => {
    const lat = d.approximateLocation?.lat;
    const lng = d.approximateLocation?.lng;
    const nyc = (lat === 40.7128 && lng === -74.006) ? 'NYC-FAKE' : 'REAL';
    const coords = d.location?.coordinates;
    // GeoJSON order: [lng, lat]
    const geoOk = coords && Math.abs(coords[0] - lng) < 0.001 && Math.abs(coords[1] - lat) < 0.001 ? 'GEOJSON-OK' : 'GEOJSON-WRONG';
    console.log(`${nyc} | ${geoOk} | ${d.foodName} | ${d.approximateLocation?.city} | lat=${lat} lng=${lng} | coords=[${coords}]`);
  });

  // GeoJSON order verification on recent non-NYC docs
  console.log('\nGEOJSON ORDER CHECK (should be [lng, lat]):');
  const nonNyc = await FoodDonation.find({
    'approximateLocation.lat': { $ne: 40.7128, $ne: null },
    'approximateLocation.lat': { $exists: true }
  }, 'foodName approximateLocation location.coordinates').sort({ createdAt: -1 }).limit(5).lean();

  nonNyc.forEach(d => {
    const approxLat = d.approximateLocation?.lat;
    const approxLng = d.approximateLocation?.lng;
    const coords = d.location?.coordinates || [];
    const geoLng = coords[0];
    const geoLat = coords[1];
    const ok = (Math.abs(geoLat - approxLat) < 0.001 && Math.abs(geoLng - approxLng) < 0.001);
    console.log(`${d.foodName}: stored lat=${approxLat} lng=${approxLng} | geojson=[${geoLng},${geoLat}] => ${ok ? 'CORRECT' : 'WRONG ORDER!'}`);
  });

  await mongoose.disconnect();
  console.log('\nAudit complete');
}

runAudit().catch(e => { console.error('AUDIT FAILED:', e.message); process.exit(1); });

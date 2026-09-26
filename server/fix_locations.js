const mongoose = require('mongoose');

async function fixLocationsDB() {
  await mongoose.connect('mongodb+srv://suds_user:Ajit4602@cluster0.hahyxek.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  
  const res = await mongoose.connection.collection('fooddonations').updateMany(
    {'approximateLocation.city': {$exists: false}},
    {$set: {
      approximateLocation: {
        city: "Unknown",
        area: "Unknown",
        lat: 40.7128,
        lng: -74.006
      },
      preciseLocation: {
        address: "Unknown",
        lat: 40.7128,
        lng: -74.006
      }
    }}
  );
  console.log('Fixed ' + res.modifiedCount + ' food donations with missing locations');

  const res2 = await mongoose.connection.collection('clothdonations').updateMany(
    {'approximateLocation.city': {$exists: false}},
    {$set: {
      approximateLocation: {
        city: "Unknown",
        area: "Unknown",
        lat: 40.7128,
        lng: -74.006
      },
      preciseLocation: {
        address: "Unknown",
        lat: 40.7128,
        lng: -74.006
      }
    }}
  );
  console.log('Fixed ' + res2.modifiedCount + ' cloth donations with missing locations');
  
  process.exit(0);
}

fixLocationsDB().catch(console.error);

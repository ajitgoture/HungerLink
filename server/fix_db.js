const mongoose = require('mongoose');

async function fixDB() {
  await mongoose.connect('mongodb+srv://suds_user:Ajit4602@cluster0.hahyxek.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  const res = await mongoose.connection.collection('fooddonations').updateMany(
    {'location.type': {$ne: 'Point'}},
    {$set: {location: {type: 'Point', coordinates: [-74.006, 40.7128]}}}
  );
  console.log('Updated ' + res.modifiedCount + ' food donations');
  
  const res2 = await mongoose.connection.collection('clothdonations').updateMany(
    {'location.type': {$ne: 'Point'}},
    {$set: {location: {type: 'Point', coordinates: [-74.006, 40.7128]}}}
  );
  console.log('Updated ' + res2.modifiedCount + ' cloth donations');
  
  process.exit(0);
}

fixDB().catch(console.error);

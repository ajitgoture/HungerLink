const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect('mongodb+srv://suds_user:Ajit4602@cluster0.hahyxek.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  
  const badDonations = await mongoose.connection.collection('fooddonations').find({
    $or: [
      {'approximateLocation.city': {$exists: false}},
      {'preciseLocation.address': {$exists: false}}
    ]
  }).toArray();
  
  console.log('Food donations missing approx/precise locations:', badDonations.length);
  process.exit(0);
}

checkDB().catch(console.error);

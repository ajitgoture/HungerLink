const mongoose = require('mongoose');

async function checkAll() {
  await mongoose.connect('mongodb+srv://suds_user:Ajit4602@cluster0.hahyxek.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  
  const fDocs = await mongoose.connection.collection('fooddonations').find({}).toArray();
  for (const doc of fDocs) {
    if (!doc.foodName) {
      await mongoose.connection.collection('fooddonations').updateOne({_id: doc._id}, {$set: {foodName: doc.title || 'Legacy Food'}});
    }
  }
  
  console.log('Fixed missing foodNames');
  process.exit(0);
}

checkAll().catch(console.error);

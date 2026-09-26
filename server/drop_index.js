const mongoose = require('mongoose');
require('dotenv').config();

const Review = require('./models/Review');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hungerlink').then(async () => {
  try {
    console.log('Connected to DB');
    await Review.collection.dropIndex('donationId_1_reviewerId_1');
    console.log('Dropped old index');
  } catch (e) {
    console.log('Index might not exist or error:', e.message);
  }
  process.exit(0);
});

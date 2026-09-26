const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Review = require('./models/Review');

const fix = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await Review.collection.dropIndex('reviewer_1_donationId_1');
    console.log('Dropped reviewer_1_donationId_1');
  } catch(e) { console.log(e.message) }
  
  try {
    await Review.collection.dropIndex('reviewer_1');
    console.log('Dropped reviewer_1');
  } catch(e) { console.log(e.message) }

  try {
    await Review.collection.dropIndex('reviewee_1');
    console.log('Dropped reviewee_1');
  } catch(e) { console.log(e.message) }

  process.exit();
}
fix();

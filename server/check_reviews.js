const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Review = require('./models/Review');

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  // Find latest reviews
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(5);
  console.log('Latest reviews:', JSON.stringify(reviews, null, 2));
  process.exit();
}
check();

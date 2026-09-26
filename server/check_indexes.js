const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Review = require('./models/Review');

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const indexes = await Review.collection.getIndexes();
  console.log(indexes);
  process.exit();
}
check();

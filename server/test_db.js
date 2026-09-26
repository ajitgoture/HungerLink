const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://user123:user123@cluster0.hahyxek.mongodb.net/smart_donation?retryWrites=true&w=majority').then(async () => {
  const user = await User.findOne({ role: { $in: ['Food Donor', 'donor'] } });
  if (user) {
    console.log('User found:', user.email);
  } else {
    console.log('No donor found');
  }
  process.exit(0);
});

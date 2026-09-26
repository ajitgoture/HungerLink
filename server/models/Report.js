const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  moduleType: {
    type: String,
    enum: ['food', 'cloth'],
  },
  reason: {
    type: String,
    enum: [
      'inappropriate behavior',
      'fake donation',
      'unsafe food',
      'misleading listing',
      'abuse',
      'other'
    ],
    required: true,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending',
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);

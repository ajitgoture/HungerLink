const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  moduleType: {
    type: String,
    enum: ['food', 'cloth'],
    required: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String, // 'DONOR' or 'RECEIVER' (role of the reviewer)
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    reliability: { type: Number, min: 1, max: 5 },
    experience: { type: Number, min: 1, max: 5 },
  },
  comment: {
    type: String,
    maxlength: 500,
  }
}, { timestamps: true });

// Prevent duplicate reviews per donation per reviewer
reviewSchema.index({ donationId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

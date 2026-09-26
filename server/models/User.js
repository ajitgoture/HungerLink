const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'Food Donor',
        'Food Receiver',
        'Cloth Donor',
        'Cloth Receiver',
        'Clothes Donor',
        'Clothes Receiver',
        'admin',
      ],
      default: 'Cloth Donor',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    location: {
      lat: { type: Number, default: 40.7128 },
      lng: { type: Number, default: -74.006 },
    },
    profileImage: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: '',
    },
    // Trust & Reliability System (Phase 10)
    isVerified: {
      type: Boolean,
      default: false, // True only if manual identity verification was done
    },
    stats: {
      averageRating: { type: Number, default: 5.0 },
      totalReviews: { type: Number, default: 0 },
      completedTransfers: { type: Number, default: 0 },
      responseRate: { type: Number, default: 100 }, // Percentage 0-100
      completionRate: { type: Number, default: 100 }, // Percentage 0-100
      cancellationRate: { type: Number, default: 0 }, // Percentage 0-100
      reliabilityScore: { type: Number, default: 100 }, // Score 0-100
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

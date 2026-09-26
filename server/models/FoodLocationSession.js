const mongoose = require('mongoose');

const foodLocationSessionSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodDonation',
      required: true,
      unique: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transferMethod: {
      type: String,
      enum: ['PICKUP', 'DELIVERY', 'PENDING'],
      default: 'PENDING',
    },
    donorSharing: {
      type: Boolean,
      default: false,
    },
    receiverSharing: {
      type: Boolean,
      default: false,
    },
    donorLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      heading: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
    receiverLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      heading: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodLocationSession', foodLocationSessionSchema);

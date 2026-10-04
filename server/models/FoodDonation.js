const mongoose = require('mongoose');

const foodDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    foodType: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Mixed Food (Vegetarian and Non-Vegetarian)'],
      required: [true, 'Food type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    unit: {
      type: String,
      default: 'plates',
    },
    peopleServed: {
      type: Number,
      required: [true, 'Estimated people served is required'],
    },
    preparationTime: {
      type: Date,
      required: true,
    },
    availableFrom: {
      type: Date,
      required: true,
    },
    expiryTime: {
      type: Date,
      required: true,
    },
    responseDeadline: {
      type: Date,
      required: true,
    },
    approximateLocation: {
      city: { type: String, required: true },
      area: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    preciseLocation: {
      address: { type: String, required: true },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    description: {
      type: String,
      default: '',
    },
    // Multi-item support: stores all food items in this donation
    foodItems: {
      type: [
        {
          foodName: { type: String, required: true },
          foodType: { type: String, default: 'Vegetarian' },
          quantity: { type: Number, required: true },
          unit: { type: String, default: 'plates' },
          peopleServed: { type: Number, required: true },
          description: { type: String, default: '' },
          preparationTime: { type: Date, required: true },
          expiryTime: { type: Date, required: true },
          status: { 
            type: String, 
            enum: ['AVAILABLE', 'EXPIRED', 'CLAIMED'], 
            default: 'AVAILABLE' 
          },
        }
      ],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    packaging: {
      type: String,
      enum: ['Packed', 'Open', 'Containers', 'Other'],
      default: 'Other',
    },
    storageCondition: {
      type: String,
      enum: ['Room Temperature', 'Refrigerated', 'Frozen'],
      default: 'Room Temperature',
    },
    allergens: [{
      type: String,
    }],
    safetyAcknowledged: {
      type: Boolean,
      required: [true, 'Donor must acknowledge food safety'],
      default: false
    },
    contactNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'AVAILABLE',
        'REQUESTED',
        'ACCEPTED',
        'READY_FOR_PICKUP',
        'READY_FOR_DELIVERY',
        'TRACKING',
        'APPROACHING',
        'ARRIVED',
        'HANDOVER_READY',
        'QR_VERIFIED',
        'RECEIVER_CONFIRMED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED'
      ],
      default: 'AVAILABLE',
    },
    transferMethod: {
      type: String,
      enum: ['PICKUP', 'DELIVERY'],
      default: null
    },
    acceptedReceiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    handoverToken: { type: String, default: null, select: false },
    handoverTokenExpiry: { type: Date, default: null, select: false },
    handoverVerified: { type: Boolean, default: false },
    handoverProofImage: { type: String, default: null },
    handoverFallbackReason: { type: String, default: null },
    urgencyAlerts: {
      mediumSent: { type: Boolean, default: false },
      highSent: { type: Boolean, default: false },
      criticalSent: { type: Boolean, default: false }
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fallback polling performance
foodDonationSchema.index({ status: 1, responseDeadline: 1, expiryTime: 1 });
foodDonationSchema.index({ donor: 1 });
foodDonationSchema.index({ acceptedReceiver: 1 });
foodDonationSchema.index({ createdAt: -1 });

// 2dsphere index for geospatial querying
foodDonationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('FoodDonation', foodDonationSchema);

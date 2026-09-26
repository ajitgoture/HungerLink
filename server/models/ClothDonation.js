const mongoose = require('mongoose');

const clothDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    items: [
      {
        recipientCategory: {
          type: String,
          enum: ['Men', 'Women', 'Children', 'Unisex'],
          required: true
        },
        type: {
          type: String,
          required: true
        },
        size: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
          validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
          }
        },
        condition: {
          type: String,
          enum: ['New', 'Like New', 'Good', 'Usable', 'Fair'],
          required: true
        },
        season: {
          type: String,
          default: 'All Season'
        }
      }
    ],
    // Legacy fields made optional for backward compatibility
    clothingCategory: {
      type: String,
      enum: ['Men', 'Women', 'Children', 'Unisex']
    },
    clothingType: {
      type: String,
      // Removed enum restriction here to avoid breaking old data if they had weird types
      required: false,
    },
    customClothingType: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: 'Unisex',
    },
    ageGroup: {
      type: String,
      default: 'Adults',
    },
    quantity: {
      type: Number,
      required: false,
      min: [1, 'Quantity must be at least 1'],
    },
    size: {
      type: String,
      required: false,
    },
    condition: {
      type: String,
      required: false,
    },
    season: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrls: [
      {
        type: String,
      },
    ],
    // Clothes Pickup Availability Fields
    availableFrom: {
      type: Date,
      required: true,
    },
    pickupDate: {
      type: String,
      default: '',
    },
    pickupTimeWindow: {
      type: String,
      default: 'Flexible',
    },
    availableUntil: {
      type: Date,
      default: null,
    },
    // CLOTHES NO LONGER REQUIRE EXPIRY
    expiryTime: {
      type: Date,
      required: false,
    },
    // CLOTHES NO LONGER REQUIRE RESPONSE DEADLINE
    responseDeadline: {
      type: Date,
      required: false,
    },
    approximateLocation: {
      city: { type: String, required: true },
      area: { type: String, default: '' },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    preciseLocation: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    city: {
      type: String,
      required: true,
    },
    qualityAcknowledged: {
      type: Boolean,
      required: [true, 'Donor must acknowledge clothing quality and cleanliness'],
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
        'TRANSFER_METHOD_SELECTED',
        'READY_FOR_PICKUP',
        'OUT_FOR_DELIVERY',
          'ON_THE_WAY',
        'ARRIVED',
        'HANDOVER_PENDING',
        'RECEIVED',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED', // Kept for legacy
      ],
      default: 'AVAILABLE',
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

// Removed expiryTime and responseDeadline from these active compound indexes
clothDonationSchema.index({ donor: 1, status: 1, city: 1, clothingCategory: 1, clothingType: 1 });
clothDonationSchema.index({ status: 1 });
clothDonationSchema.index({ donor: 1 });
clothDonationSchema.index({ acceptedReceiver: 1 });
clothDonationSchema.index({ createdAt: -1 });

// 2dsphere index for geospatial querying
clothDonationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ClothDonation', clothDonationSchema);

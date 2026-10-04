const mongoose = require('mongoose');

const clothRequestSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClothDonation',
      required: true,
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
    requestedItems: [{
      itemId: { type: String, required: true },
      quantity: { type: Number, required: true },
    }],
    receiverLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      }
    },
    status: {
      type: String,
      enum: [
        'PENDING', 'ACCEPTED', 'REJECTED', 'NOT_SELECTED', 'RECEIVED', 'COMPLETED', 'EXPIRED',
        'READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'TRACKING', 'APPROACHING', 'ARRIVED', 'HANDOVER_READY', 'QR_VERIFIED', 'RECEIVER_CONFIRMED', 'CANCELLED'
      ],
      default: 'PENDING',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
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

clothRequestSchema.index({ donation: 1, status: 1, requestedAt: 1 });
clothRequestSchema.index({ receiverLocation: '2dsphere' });

module.exports = mongoose.model('ClothRequest', clothRequestSchema);

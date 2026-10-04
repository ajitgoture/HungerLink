const mongoose = require('mongoose');

const clothLocationSessionSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClothDonation',
      required: true,
      unique: true,
    },
    donationModel: { type: String, default: 'ClothDonation' },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClothRequest',
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

    // Handover Destination
    handoverLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },

    // Initial Start Points
    donorStartLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },
    receiverStartLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },

    // Live Location Trackers (GeoJSON)
    donorLiveLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
      heading: { type: Number },
    },
    receiverLiveLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
      heading: { type: Number },
    },

    // Legacy fallback fields
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
    donorSharing: { type: Boolean, default: false },
    receiverSharing: { type: Boolean, default: false },
    proximityMilestones: { type: [String], default: [] },

    // Tracking State
    trackingMode: {
      type: String,
      enum: ['NONE', 'PICKUP', 'DELIVERY', 'PENDING'],
      default: 'NONE',
    },
    transferMethod: {
      type: String,
      enum: ['NONE', 'PICKUP', 'DELIVERY', 'PENDING'],
      default: 'PENDING',
    },
    trackingStatus: {
      type: String,
      enum: ['WAITING', 'ACTIVE', 'PAUSED', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
      default: 'WAITING'
    },

    distanceRemaining: { type: Number, default: null },
    etaSeconds: { type: Number, default: null },

    donorArrived: { type: Boolean, default: false },
    receiverArrived: { type: Boolean, default: false },
    donorArrivedAt: { type: Date, default: null },
    receiverArrivedAt: { type: Date, default: null },

    handoverStatus: {
      type: String,
      enum: ['PENDING', 'INITIATED', 'VERIFIED', 'FAILED'],
      default: 'PENDING'
    },
    qrVerificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'BYPASSED', 'FAILED'],
      default: 'PENDING'
    },
    receiverConfirmationStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED'],
      default: 'PENDING'
    },

    lastLocationUpdate: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
clothLocationSessionSchema.index({ 'donorLiveLocation': '2dsphere' });
clothLocationSessionSchema.index({ 'receiverLiveLocation': '2dsphere' });
clothLocationSessionSchema.index({ 'handoverLocation': '2dsphere' });

module.exports = mongoose.model('ClothLocationSession', clothLocationSessionSchema);

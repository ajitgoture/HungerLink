const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  moduleType: {
    type: String,
    enum: ['food', 'cloth'],
    required: true,
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageText: {
    type: String,
    default: '',
  }
}, { timestamps: true });

conversationSchema.index({ donationId: 1 }, { unique: true });
conversationSchema.index({ donorId: 1, receiverId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

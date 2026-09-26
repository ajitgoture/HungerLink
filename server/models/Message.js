const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    trim: true,
  },
  readAt: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

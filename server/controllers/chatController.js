const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');

// Validate Participant
const validateParticipant = async (moduleType, donationId, userId) => {
  const Model = moduleType === 'food' ? FoodDonation : ClothDonation;
  const donation = await Model.findById(donationId);
  
  if (!donation) throw new Error('Donation not found');

  const donorId = donation.donor._id?.toString() || donation.donor.toString();
  const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();

  if (!receiverId) throw new Error('Donation does not have an accepted receiver yet');

  if (userId !== donorId && userId !== receiverId) {
    throw new Error('Access denied: You are not authorized to view this chat.');
  }

  return { donorId, receiverId };
};

// 1. Get or Create Conversation
const getConversation = async (req, res) => {
  try {
    const { moduleType, donationId } = req.params;
    const userId = req.user._id.toString();

    // Verify ownership/acceptance
    const { donorId, receiverId } = await validateParticipant(moduleType, donationId, userId);

    let conversation = await Conversation.findOne({ donationId });
    if (!conversation) {
      conversation = await Conversation.create({
        donationId,
        moduleType,
        donorId,
        receiverId,
      });
      
      // Auto-create initial system message
      await Message.create({
        conversationId: conversation._id,
        isSystem: true,
        text: 'Request accepted. The chat is now open for coordinating the transfer.'
      });
    }

    res.json(conversation);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

// 2. Get Messages for a Conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // Validate
    await validateParticipant(conversation.moduleType, conversation.donationId, req.user._id.toString());

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

// 3. Mark Messages as Read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // Mark all messages in this conversation where sender is NOT me as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, readAt: null, isSystem: false },
      { $set: { readAt: new Date() } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read' });
  }
};

module.exports = {
  getConversation,
  getMessages,
  markAsRead
};

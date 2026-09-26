const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getConversation, getMessages, markAsRead } = require('../controllers/chatController');

router.get('/:moduleType/:donationId', protect, getConversation);
router.get('/:conversationId/messages', protect, getMessages);
router.patch('/:conversationId/read', protect, markAsRead);

module.exports = router;

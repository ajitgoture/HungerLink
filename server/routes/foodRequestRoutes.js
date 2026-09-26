const express = require('express');
const router = express.Router();
const {
  createRequest,
  getDonorRequests,
  getReceiverRequests,
  acceptRequest,
  rejectRequest,
  confirmFoodReceived,
} = require('../controllers/foodRequestController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/', protect, requireRole('Food Receiver', 'admin'), createRequest);
router.get('/donor', protect, requireRole('Food Donor', 'admin'), getDonorRequests);
router.get('/receiver', protect, requireRole('Food Receiver', 'admin'), getReceiverRequests);
router.patch('/:id/accept', protect, requireRole('Food Donor', 'admin'), acceptRequest);
router.patch('/:id/reject', protect, requireRole('Food Donor', 'admin'), rejectRequest);
router.patch('/:id/confirm-received', protect, requireRole('Food Receiver', 'admin'), confirmFoodReceived);

module.exports = router;

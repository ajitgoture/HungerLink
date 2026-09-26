const express = require('express');
const router = express.Router();
const {
  createClothRequest,
  getDonorClothRequests,
  getReceiverClothRequests,
  acceptClothRequest,
  rejectClothRequest,
  confirmClothReceived,
} = require('../controllers/clothRequestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createClothRequest);
router.get('/donor', protect, getDonorClothRequests);
router.get('/receiver', protect, getReceiverClothRequests);
router.patch('/:id/accept', protect, acceptClothRequest);
router.patch('/:id/reject', protect, rejectClothRequest);
router.patch('/:id/confirm-received', protect, confirmClothReceived);

module.exports = router;

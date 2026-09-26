const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  setTransferMethod,
  markOnTheWay,
  markArrived,
  initiateHandover,
  completeTransfer,
  cancelTransfer,
  generateHandoverToken,
  verifyHandoverToken
} = require('../controllers/transferController');

router.post('/:moduleType/:donationId/method', protect, setTransferMethod);
router.patch('/:moduleType/:donationId/on-the-way', protect, markOnTheWay);
router.patch('/:moduleType/:donationId/arrived', protect, markArrived);
router.patch('/:moduleType/:donationId/handover', protect, initiateHandover);
router.patch('/:moduleType/:donationId/complete', protect, completeTransfer);
router.patch('/:moduleType/:donationId/cancel', protect, cancelTransfer);

// Phase 9: Handover Token routes
router.get('/:moduleType/:donationId/handover-token', protect, generateHandoverToken);
router.post('/:moduleType/:donationId/verify-handover', protect, verifyHandoverToken);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { submitReview, checkReviewStatus, submitReport, getPendingReviews } = require('../controllers/reviewController');

router.get('/pending', protect, getPendingReviews);
router.post('/submit', protect, submitReview);
router.get('/status/:donationId', protect, checkReviewStatus);
router.post('/report', protect, submitReport);

module.exports = router;

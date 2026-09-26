const express = require('express');
const router = express.Router();
const { getLocationSession, setTransferMethod } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/session/:donationId', protect, getLocationSession);
router.post('/transfer-method', protect, setTransferMethod);

module.exports = router;

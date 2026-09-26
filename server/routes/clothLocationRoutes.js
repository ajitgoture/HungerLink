const express = require('express');
const router = express.Router();
const { getClothLocationSession, setClothTransferMethod } = require('../controllers/clothLocationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/session/:donationId', protect, getClothLocationSession);
router.post('/transfer-method', protect, setClothTransferMethod);

module.exports = router;

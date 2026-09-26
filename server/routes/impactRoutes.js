const express = require('express');
const router = express.Router();
const { getPersonalImpact, getCommunityImpact } = require('../controllers/impactController');
const { protect } = require('../middleware/authMiddleware');

router.get('/personal', protect, getPersonalImpact);
router.get('/community', getCommunityImpact); // public access allows homepage stats to be dynamic if desired

module.exports = router;

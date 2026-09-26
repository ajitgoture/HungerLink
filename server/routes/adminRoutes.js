const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getSystemStats, getLiveOperations, getUsers, getReports, getAnalytics } = require('../controllers/adminController');

// All admin routes must be protected and require 'admin' role
router.use(protect);
router.use(requireRole('admin'));

router.get('/stats', getSystemStats);
router.get('/operations/live', getLiveOperations);
router.get('/users', getUsers);
router.get('/reports', getReports);
router.get('/analytics', getAnalytics);

module.exports = router;

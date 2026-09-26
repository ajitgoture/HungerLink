const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createFoodDonation,
  getAvailableDonations,
  getMyDonations,
  getDonationById,
  updateDonationStatus,
  getDonationsByDonor,
} = require('../controllers/foodDonationController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', protect, requireRole('Food Donor', 'admin'), upload.single('foodImage'), createFoodDonation);
router.get('/available', getAvailableDonations);
router.get('/my-donations', protect, requireRole('Food Donor', 'admin'), getMyDonations);
router.get('/donor/:donorId', getDonationsByDonor);
router.get('/:id', protect, getDonationById);
router.patch('/:id/status', protect, requireRole('Food Donor', 'admin'), updateDonationStatus);

module.exports = router;

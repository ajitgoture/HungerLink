const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createClothDonation,
  getAvailableClothDonations,
  getMyClothDonations,
  getClothDonationById,
  updateClothDonationStatus,
} = require('../controllers/clothDonationController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', protect, upload.array('clothingImages', 5), createClothDonation);
router.get('/available', getAvailableClothDonations);
router.get('/my-donations', protect, getMyClothDonations);
router.get('/:id', protect, getClothDonationById);
router.patch('/:id/status', protect, updateClothDonationStatus);

module.exports = router;

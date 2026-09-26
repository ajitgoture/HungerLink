const express = require('express');
const router = express.Router();
const { getExploreDonations } = require('../controllers/exploreController');

router.get('/', getExploreDonations);

module.exports = router;

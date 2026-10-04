const FoodDonation = require('../models/FoodDonation');
const FoodRequest = require('../models/FoodRequest');
const FoodLocationSession = require('../models/FoodLocationSession');
const Notification = require('../models/Notification');

// @route   GET /api/food/location/session/:donationId
const getLocationSession = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await FoodDonation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const userId = req.user._id.toString();
    const donorId = donation.donor.toString();
    const acceptedReceiverId = donation.acceptedReceiver ? donation.acceptedReceiver.toString() : null;

    if (userId !== donorId && userId !== acceptedReceiverId) {
      return res.status(403).json({ message: 'ACCESS DENIED: Live location is available only to the donor and accepted receiver.' });
    }

    let session = await FoodLocationSession.findOne({ donation: donationId })
      .populate('donor', 'name phone')
      .populate('receiver', 'name phone');

    if (!session && acceptedReceiverId) {
      session = await FoodLocationSession.create({
        donation: donationId,
        donor: donorId,
        receiver: acceptedReceiverId,
        transferMethod: donation.status === 'READY_FOR_PICKUP' ? 'PICKUP' : donation.status === 'READY_FOR_DELIVERY' ? 'DELIVERY' : 'PENDING',
      });
      session = await session.populate('donor receiver', 'name phone');
    }

    res.json({ session, donation });
  } catch (error) {
    console.error('Error fetching location session:', error);
    res.status(500).json({ message: 'Error loading live location session' });
  }
};

// @route   POST /api/food/location/transfer-method
const setTransferMethod = async (req, res) => {
  req.params.moduleType = 'food';
  req.params.donationId = req.body.donationId;
  req.body.method = req.body.transferMethod;
  return require('./transferController').setTransferMethod(req, res);
};

module.exports = {
  getLocationSession,
  setTransferMethod,
};

const ClothDonation = require('../models/ClothDonation');
const ClothRequest = require('../models/ClothRequest');
const ClothLocationSession = require('../models/ClothLocationSession');
const Notification = require('../models/Notification');

// @route   GET /api/cloth/location/session/:donationId
const getClothLocationSession = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await ClothDonation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Clothes donation not found' });
    }

    const userId = req.user._id.toString();
    const donorId = donation.donor.toString();
    const acceptedReceiverId = donation.acceptedReceiver ? donation.acceptedReceiver.toString() : null;

    if (userId !== donorId && userId !== acceptedReceiverId) {
      return res.status(403).json({ message: 'ACCESS DENIED: Live location is available only to the cloth donor and accepted receiver.' });
    }

    let session = await ClothLocationSession.findOne({ donation: donationId })
      .populate('donor', 'name phone')
      .populate('receiver', 'name phone');

    if (!session && acceptedReceiverId) {
      session = await ClothLocationSession.create({
        donation: donationId,
        donor: donorId,
        receiver: acceptedReceiverId,
        transferMethod: donation.status === 'READY_FOR_PICKUP' ? 'PICKUP' : donation.status === 'READY_FOR_DELIVERY' ? 'DELIVERY' : 'PENDING',
      });
      session = await session.populate('donor receiver', 'name phone');
    }

    res.json({ session, donation });
  } catch (error) {
    console.error('Error fetching clothes location session:', error);
    res.status(500).json({ message: 'Error loading clothes live location session' });
  }
};

// @route   POST /api/cloth/location/transfer-method
const setClothTransferMethod = async (req, res) => {
  req.params.moduleType = 'cloth';
  req.params.donationId = req.body.donationId;
  req.body.method = req.body.transferMethod;
  return require('./transferController').setTransferMethod(req, res);
};

module.exports = {
  getClothLocationSession,
  setClothTransferMethod,
};

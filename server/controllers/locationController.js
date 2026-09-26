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
        transferMethod: donation.status === 'READY_FOR_PICKUP' ? 'PICKUP' : donation.status === 'OUT_FOR_DELIVERY' ? 'DELIVERY' : 'PENDING',
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
  try {
    const { donationId, transferMethod } = req.body;

    if (!['PICKUP', 'DELIVERY'].includes(transferMethod)) {
      return res.status(400).json({ message: 'Invalid transfer method.' });
    }

    const donation = await FoodDonation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the donor can set the transfer method.' });
    }

    const newStatus = transferMethod === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
    donation.status = newStatus;
    await donation.save();

    if (donation.acceptedReceiver) {
      await FoodRequest.findOneAndUpdate(
        { donation: donationId, receiver: donation.acceptedReceiver },
        { status: newStatus }
      );
    }

    let session = await FoodLocationSession.findOne({ donation: donationId });
    if (!session && donation.acceptedReceiver) {
      session = await FoodLocationSession.create({
        donation: donationId,
        donor: donation.donor,
        receiver: donation.acceptedReceiver,
        transferMethod,
      });
    } else if (session) {
      session.transferMethod = transferMethod;
      await session.save();
    }

    // User-Friendly Notification for Receiver
    const notifMsg = transferMethod === 'PICKUP'
      ? `Your food item "${donation.foodName}" is ready for pickup.`
      : `Your food item "${donation.foodName}" is out for delivery.`;

    const notif = await Notification.create({
      recipient: donation.acceptedReceiver,
      title: transferMethod === 'PICKUP' ? 'Ready for Pickup 📦' : 'Out for Delivery 🚚',
      message: notifMsg,
      type: 'TRANSFER_METHOD_SET',
      relatedDonation: donation._id,
    });

    const io = req.app.get('socketio');
    if (io && donation.acceptedReceiver) {
      io.to(`user_${donation.acceptedReceiver.toString()}`).emit('TRANSFER_METHOD_SET', {
        notification: notif,
        donationId: donation._id,
        transferMethod,
        status: newStatus,
      });
      io.to(`user_${donation.acceptedReceiver.toString()}`).emit('notification:new', notif);
    }

    res.json({ message: 'Transfer method set successfully', donation, session });
  } catch (error) {
    console.error('Error setting transfer method:', error);
    res.status(500).json({ message: 'Error setting transfer method' });
  }
};

module.exports = {
  getLocationSession,
  setTransferMethod,
};

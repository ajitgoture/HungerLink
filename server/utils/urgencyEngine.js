const Notification = require('../models/Notification');
const FoodDonation = require('../models/FoodDonation');
const ClothDonation = require('../models/ClothDonation');
const FoodRequest = require('../models/FoodRequest');
const ClothRequest = require('../models/ClothRequest');

const URGENCY_THRESHOLDS = {
  CRITICAL: 30 * 60 * 1000, // < 30 mins
  HIGH: 2 * 60 * 60 * 1000, // < 2 hours
  MEDIUM: 6 * 60 * 60 * 1000, // < 6 hours
};

const getUrgencyLevel = (expiryTime) => {
  const timeRemaining = new Date(expiryTime).getTime() - Date.now();
  if (timeRemaining <= 0) return 'EXPIRED';
  if (timeRemaining <= URGENCY_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (timeRemaining <= URGENCY_THRESHOLDS.HIGH) return 'HIGH';
  if (timeRemaining <= URGENCY_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

const processUrgencyAlerts = async (donation, moduleType, io) => {
  const urgency = getUrgencyLevel(donation.expiryTime);
  let updated = false;

  // Function to send alert if not already sent
  const sendAlert = async (level, title, message) => {
    const flagMap = {
      'MEDIUM': 'mediumSent',
      'HIGH': 'highSent',
      'CRITICAL': 'criticalSent'
    };
    const flag = flagMap[level];

    if (!donation.urgencyAlerts[flag]) {
      donation.urgencyAlerts[flag] = true;
      updated = true;

      const notif = await Notification.create({
        recipient: donation.donor,
        title,
        message,
        type: 'SYSTEM_ALERT',
        relatedDonation: donation._id
      });

      if (io) {
        io.to(`user_${donation.donor.toString()}`).emit('notification:new', notif);
        io.to(`user_${donation.donor.toString()}`).emit('donation:urgency_updated', {
          donationId: donation._id,
          urgency: level
        });
      }
    }
  };

  if (urgency === 'CRITICAL') {
    await sendAlert('CRITICAL', 'CRITICAL ALERT: Donation Expiring Soon dY`h', `Your donation "${donation.foodName || donation.clothingType}" will expire in less than 30 minutes!`);
  } else if (urgency === 'HIGH') {
    await sendAlert('HIGH', 'HIGH ALERT: Expiring in < 2 hours', `Your donation "${donation.foodName || donation.clothingType}" expires in less than 2 hours.`);
  } else if (urgency === 'MEDIUM') {
    await sendAlert('MEDIUM', 'Reminder: Donation Expiring', `Your donation "${donation.foodName || donation.clothingType}" expires in less than 6 hours.`);
  }

  if (updated) {
    await donation.save({ validateBeforeSave: false });
  }
};

const processAutomaticExpiry = async (donation, moduleType, io) => {
  if (donation.status === 'EXPIRED') return; // already processed
  
  const now = Date.now();
  let updatedItems = false;
  let allExpired = false;
  let shouldExpireRoot = false;

  if (moduleType === 'food' && donation.foodItems && donation.foodItems.length > 0) {
    donation.foodItems.forEach(item => {
      if (item.status !== 'EXPIRED' && item.status !== 'CLAIMED' && new Date(item.expiryTime).getTime() <= now) {
        item.status = 'EXPIRED';
        updatedItems = true;
      }
    });

    allExpired = donation.foodItems.every(item => item.status === 'EXPIRED');
    if (allExpired && !['COMPLETED', 'CANCELLED', 'RECEIVED'].includes(donation.status)) {
      shouldExpireRoot = true;
    } else if (updatedItems) {
      await donation.save({ validateBeforeSave: false });
    }
  } else {
    if (new Date(donation.expiryTime).getTime() <= now && !['COMPLETED', 'CANCELLED', 'RECEIVED'].includes(donation.status)) {
      shouldExpireRoot = true;
    }
  }
  
  if (shouldExpireRoot) {
    donation.status = 'EXPIRED';
    await donation.save({ validateBeforeSave: false });

    // Notify Donor
    const notif = await Notification.create({
      recipient: donation.donor,
      title: 'Donation Expired',
      message: `Your donation "${donation.foodName || donation.clothingType}" has expired.`,
      type: 'DONATION_EXPIRED',
      relatedDonation: donation._id
    });

    if (io) {
      io.to(`user_${donation.donor.toString()}`).emit('notification:new', notif);
      io.to(`user_${donation.donor.toString()}`).emit('donation:expired', { donationId: donation._id });
    }

    // Process Requests
    const RequestModel = moduleType === 'food' ? FoodRequest : ClothRequest;
    
    // Expire Pending Requests
    const pendingReqs = await RequestModel.find({ donation: donation._id, status: 'PENDING' });
    for (const req of pendingReqs) {
      req.status = 'EXPIRED';
      await req.save();

      const rNotif = await Notification.create({
        recipient: req.requester || req.receiver,
        title: 'Request Expired',
        message: `The donation you requested has expired.`,
        type: 'REQUEST_EXPIRED',
        relatedDonation: donation._id
      });
      if (io) {
        const recId = req.requester || req.receiver;
        io.to(`user_${recId.toString()}`).emit('notification:new', rNotif);
        io.to(`user_${recId.toString()}`).emit('request:expired', { requestId: req._id, donationId: donation._id });
      }
    }

    // Cancel Accepted Transfer if it didn't complete
    if (['ACCEPTED', 'TRANSFER_METHOD_SELECTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'HANDOVER_PENDING'].includes(donation.status)) {
       if (donation.acceptedReceiver) {
          const rNotif = await Notification.create({
            recipient: donation.acceptedReceiver,
            title: 'Transfer Cancelled (Expired)',
            message: `The active transfer for "${donation.foodName || donation.clothingType}" has automatically expired.`,
            type: 'TRANSFER_UPDATE',
            relatedDonation: donation._id
          });
          if (io) {
             io.to(`user_${donation.acceptedReceiver.toString()}`).emit('notification:new', rNotif);
             io.to(`user_${donation.acceptedReceiver.toString()}`).emit('transfer:cancelled', { donationId: donation._id, reason: 'EXPIRED' });
          }
       }
    }
  }
};

module.exports = {
  URGENCY_THRESHOLDS,
  getUrgencyLevel,
  processUrgencyAlerts,
  processAutomaticExpiry
};

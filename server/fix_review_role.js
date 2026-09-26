const fs = require('fs');
let s = fs.readFileSync('controllers/reviewController.js', 'utf8');

const oldLogic = `    // 2. Determine role and reviewee
    const donorId = donation.donor._id?.toString() || donation.donor.toString();
    let receiverId = providedRevieweeId || donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();
    
    if (!receiverId && reqCompleted) {
      const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');
      const reqDoc = await RequestModel.findOne({ donation: donationId, status: 'COMPLETED' }).sort({ updatedAt: -1 });
      if (reqDoc) receiverId = reqDoc.receiver.toString();
    }

    let role, revieweeId;
    if (reviewerId === donorId) {
      role = 'DONOR';
      revieweeId = receiverId;
    } else if (reviewerId === receiverId) {
      role = 'RECEIVER';
      revieweeId = donorId;
    } else {
      return res.status(403).json({ message: 'You were not a participant in this transfer' });
    }`;

const newLogic = `    // 2. Determine role and reviewee
    let role;
    let finalRevieweeId = providedRevieweeId;
    const donorId = donation.donor._id?.toString() || donation.donor.toString();

    const RequestModel = moduleType === 'food' ? require('../models/FoodRequest') : require('../models/ClothRequest');

    if (reviewerId === donorId) {
      role = 'DONOR';
      // If donor didn't provide reviewee, try to fallback
      if (!finalRevieweeId) {
        const reqDoc = await RequestModel.findOne({ donation: donationId, donor: reviewerId, status: 'COMPLETED' }).sort({ updatedAt: -1 });
        if (reqDoc) finalRevieweeId = reqDoc.receiver.toString();
      }
      
      // Verify receiver was part of this donation
      const validReq = await RequestModel.exists({ donation: donationId, donor: reviewerId, receiver: finalRevieweeId, status: 'COMPLETED' });
      if (!validReq && donation.acceptedReceiver?.toString() !== finalRevieweeId?.toString()) {
        return res.status(403).json({ message: 'You were not a participant in this transfer with the specified user' });
      }
    } else {
      role = 'RECEIVER';
      finalRevieweeId = donorId; // The receiver ALWAYS rates the donor

      const validReq = await RequestModel.exists({ donation: donationId, donor: finalRevieweeId, receiver: reviewerId, status: 'COMPLETED' });
      if (!validReq && donation.acceptedReceiver?.toString() !== reviewerId) {
        return res.status(403).json({ message: 'You were not a participant in this transfer' });
      }
    }
    
    const revieweeId = finalRevieweeId;
    if (!revieweeId) return res.status(400).json({ message: 'Could not determine reviewee' });`;

s = s.replace(oldLogic, newLogic);
fs.writeFileSync('controllers/reviewController.js', s);
console.log('Fixed role logic in reviewController.js');

const fs = require('fs');

let content = fs.readFileSync('server/controllers/transferController.js', 'utf8');

const oldGenerate = `
    const { moduleType, donationId } = req.params;
    const userId = req.user._id.toString();

    const { donation, Model } = await validateParticipant(moduleType, donationId, userId);
    
    // Must be donor
    if (donation.donor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the donor can generate the handover token' });
    }
`;

const newGenerate = `
    const { moduleType, donationId } = req.params;
    const userId = req.user._id.toString();

    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    validateParticipant(donation, userId);
    
    // Must be donor
    if (donation.donor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the donor can generate the handover token' });
    }
`;

const oldVerify = `
    const { moduleType, donationId } = req.params;
    const { token } = req.body;
    const userId = req.user._id.toString();

    const { donation, Model } = await validateParticipant(moduleType, donationId, userId);

    // Must be receiver
    if (donation.acceptedReceiver.toString() !== userId) {
      return res.status(403).json({ message: 'Only the receiver can verify the handover token' });
    }
`;

const newVerify = `
    const { moduleType, donationId } = req.params;
    const { token } = req.body;
    const userId = req.user._id.toString();

    const Model = getModel(moduleType);
    let donation = await Model.findById(donationId).select('+handoverToken +handoverTokenExpiry +handoverVerified +expiryTime');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    validateParticipant(donation, userId);

    // Must be receiver
    if (donation.acceptedReceiver.toString() !== userId) {
      return res.status(403).json({ message: 'Only the receiver can verify the handover token' });
    }
`;

const oldComplete = `
    const { moduleType, donationId } = req.params;
    const { fallbackReason, proofImage } = req.body || {};
    
    // We need validateParticipant which now returns { donation, Model }
    const userId = req.user._id.toString();
    const { donation, Model } = await validateParticipant(moduleType, donationId, userId);
    
    verifyTransition(donation.status, 'COMPLETED');
`;

const newComplete = `
    const { moduleType, donationId } = req.params;
    const { fallbackReason, proofImage } = req.body || {};
    
    const userId = req.user._id.toString();
    const Model = getModel(moduleType);
    const donation = await Model.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    validateParticipant(donation, userId);
    
    verifyTransition(donation.status, 'COMPLETED');
`;

content = content.replace(oldGenerate, newGenerate);

// Verify has donationWithToken logic, so I should be careful to merge them
content = content.replace(oldVerify, newVerify);
content = content.replace(`    // Since select: false, we need to explicitly fetch the token fields\n    const donationWithToken = await Model.findById(donationId).select('+handoverToken +handoverTokenExpiry +handoverVerified +expiryTime');`, `    const donationWithToken = donation;`);

content = content.replace(oldComplete, newComplete);

fs.writeFileSync('server/controllers/transferController.js', content);
console.log('Fixed transferController.js');

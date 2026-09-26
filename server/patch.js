const fs = require('fs'); 
let content = fs.readFileSync('controllers/transferController.js', 'utf-8'); 

const oldVerify = `    // Since select: false, we need to explicitly fetch the token fields
    const donationWithToken = await Model.findById(donationId).select('+handoverToken +handoverTokenExpiry');

    if (!donationWithToken.handoverToken) {
      return res.status(400).json({ message: 'Donor has not generated a token yet' });
    }

    if (donationWithToken.handoverTokenExpiry < new Date()) {
      return res.status(400).json({ message: 'Token has expired. Ask donor to generate a new one' });
    }

    if (donationWithToken.handoverToken !== token) {
      return res.status(400).json({ message: 'Invalid handover token' });
    }

    // Verify
    donation.handoverVerified = true;
    await donation.save();`;

const newVerify = `    // Since select: false, we need to explicitly fetch the token fields
    const donationWithToken = await Model.findById(donationId).select('+handoverToken +handoverTokenExpiry +handoverVerified +expiryTime');

    if (donationWithToken.handoverVerified) {
      return res.status(400).json({ message: 'This handover token has already been used and verified.' });
    }

    if (donationWithToken.expiryTime && new Date(donationWithToken.expiryTime) < new Date()) {
      return res.status(400).json({ message: 'This food donation has already expired.' });
    }

    if (!donationWithToken.handoverToken) {
      return res.status(400).json({ message: 'Donor has not generated a token yet.' });
    }

    if (donationWithToken.handoverTokenExpiry < new Date()) {
      return res.status(400).json({ message: 'Token has expired. Ask donor to generate a new one.' });
    }

    if (donationWithToken.handoverToken !== token) {
      return res.status(400).json({ message: 'Invalid handover token.' });
    }

    // Verify
    donation.handoverVerified = true;
    
    // Invalidate the token so it cannot be reused
    donation.handoverToken = null;
    donation.handoverTokenExpiry = null;
    
    await donation.save();`;

content = content.replace(oldVerify, newVerify);
fs.writeFileSync('controllers/transferController.js', content);

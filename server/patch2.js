const fs = require('fs'); 
let content = fs.readFileSync('controllers/transferController.js', 'utf-8'); 

const oldGen = `    donation.handoverToken = token;
    donation.handoverTokenExpiry = expiry;
    await donation.save();

    res.json({ token, expiresAt: expiry });`;

const newGen = `    donation.handoverToken = token;
    donation.handoverTokenExpiry = expiry;
    await donation.save();

    // Construct robust QR payload
    const qrPayload = JSON.stringify({
      donationId: donation._id,
      token: token,
      purpose: 'HungerLink_Handover_Verification'
    });

    res.json({ token, expiresAt: expiry, qrPayload });`;

content = content.replace(oldGen, newGen);
fs.writeFileSync('controllers/transferController.js', content);

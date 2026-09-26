const fs = require('fs');

// 1. Patch reviewController.js
let reviewContent = fs.readFileSync('controllers/reviewController.js', 'utf8');
reviewContent = reviewContent.replace(
  /\/\/ Bumping completed transfers arbitrarily if it's their first review\s+user\.stats\.completedTransfers \+= 1;/g,
  `// (completedTransfers is now correctly incremented exactly once during completeTransfer)`
);
fs.writeFileSync('controllers/reviewController.js', reviewContent);
console.log('Patched reviewController.js');

// 2. Patch transferController.js
let transferContent = fs.readFileSync('controllers/transferController.js', 'utf8');
const completeTransferTarget = `await activeRequest.save();`;
const patchToInsert = `
      await activeRequest.save();
      
      // Update completion stats natively in DB
      try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(donation.donor, { $inc: { 'stats.completedTransfers': 1 } });
        await User.findByIdAndUpdate(donation.acceptedReceiver, { $inc: { 'stats.completedTransfers': 1 } });
      } catch(e) { console.error('Stat update error:', e); }
`;
if (!transferContent.includes('stats.completedTransfers')) {
  transferContent = transferContent.replace(completeTransferTarget, patchToInsert);
  fs.writeFileSync('controllers/transferController.js', transferContent);
  console.log('Patched transferController.js');
}

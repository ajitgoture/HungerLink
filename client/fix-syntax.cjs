const fs = require('fs');
const file = 'd:/Smart_Unified_Donation_System/server/controllers/clothDonationController.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/let doc = mapLegacyToItems\(d\.toObject\(\)\);\s*const doc = d\.toObject\(\);/g, 'let doc = mapLegacyToItems(d.toObject());');

fs.writeFileSync(file, c);

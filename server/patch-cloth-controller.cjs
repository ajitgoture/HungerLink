const fs = require('fs');
const file = 'controllers/clothDonationController.js';
let c = fs.readFileSync(file, 'utf8');

const regex1 = /let expDate = [^]*?respDeadlineDate = expDate;\s*}/;
c = c.replace(regex1, '');

c = c.replace(/expiryTime: expDate,/g, '');
c = c.replace(/responseDeadline: respDeadlineDate,/g, '');
c = c.replace(/expiryTime: \{ \$gt: now \},/g, '');
c = c.replace(/expiryTime,\s*responseDeadline,/g, '');

fs.writeFileSync(file, c);

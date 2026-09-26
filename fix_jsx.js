const fs = require('fs');
let s = fs.readFileSync('client/src/pages/DonationDetail.jsx', 'utf8');
s = s.replace(/\\\`/g, '`');
s = s.replace(/\\\$/g, '$');
fs.writeFileSync('client/src/pages/DonationDetail.jsx', s);
console.log('Fixed backslashes');

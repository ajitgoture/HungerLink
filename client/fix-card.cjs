const fs = require('fs');
let c = fs.readFileSync('client/src/components/DonationCard.jsx', 'utf8');

// Fix encoding issues
c = c.replace(/\?/g, '•');
c = c.replace(/\?"/g, '-');

// Fix syntax error
c = c.replace(/}\s*\{item\.donor\?\.name/, ')}\n          {item.donor?.name');

fs.writeFileSync('client/src/components/DonationCard.jsx', c);

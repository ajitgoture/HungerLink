const fs = require('fs');
let c = fs.readFileSync('src/components/DonationCard.jsx', 'utf-8');
c = c.replace(/'Exp:' : 'Listed:'/g, "t('Exp:') : t('Listed:')");
fs.writeFileSync('src/components/DonationCard.jsx', c);
console.log("Patched DonationCard");

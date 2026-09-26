const fs = require('fs');
let c = fs.readFileSync('src/pages/cloth/DonateClothForm.jsx', 'utf8');
c = c.replace(/\{items\.length > 1 && \(/g, '{idx > 0 && (');
fs.writeFileSync('src/pages/cloth/DonateClothForm.jsx', c);

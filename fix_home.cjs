const fs = require('fs');

let c = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

// Fix Map arrays
c = c.replace(/label: '([^']+)'/g, 'label: t("$1")');
c = c.replace(/desc: '([^']+)'/g, 'desc: t("$1")');
c = c.replace(/title: '([^']+)'/g, 'title: t("$1")');
c = c.replace(/'([^']+)'.map\(f/g, "t('$1').map(f"); 
// Wait, the above is dangerous. The array is ['Smart category...', '...']
c = c.replace(/\['([^']+)', '([^']+)', '([^']+)', '([^']+)'\]\.map/g, "[t('$1'), t('$2'), t('$3'), t('$4')].map");

// Fix stats array
c = c.replace(/label: 'Donations Shared'/g, 'label: t("Donations Shared")');
c = c.replace(/label: 'People Helped'/g, 'label: t("People Helped")');
c = c.replace(/label: 'Active Donors'/g, 'label: t("Active Donors")');
c = c.replace(/label: 'Community Rating'/g, 'label: t("Community Rating")');

fs.writeFileSync('client/src/pages/Home.jsx', c);
console.log('Fixed Home.jsx arrays');

const fs = require('fs');
let c = fs.readFileSync('d:/Smart_Unified_Donation_System/server/controllers/clothDonationController.js', 'utf8');

c = c.replace(/const sanitized = donations\.map\(\(d\) => \{[\s\S]*?return doc;\s*\}\);/,
`const sanitized = donations.map((d) => {
      let doc = mapLegacyToItems(d.toObject());
      delete doc.preciseLocation;
      if (userLat && userLng) {
        doc.distanceKm = calculateDistance(userLat, userLng, doc.approximateLocation.lat, doc.approximateLocation.lng);
      }
      return doc;
    });`);

fs.writeFileSync('d:/Smart_Unified_Donation_System/server/controllers/clothDonationController.js', c);

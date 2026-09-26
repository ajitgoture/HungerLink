const fs = require('fs');
let file = 'client/src/pages/cloth/AvailableClothes.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace selectedDonation.title
content = content.replace(
  /\{t\("Requesting \\""\)\}\{selectedDonation\.title\}" \(\{selectedDonation\.quantity\} \{t\("items"\)\}/,
  `{t("Requesting")} {selectedDonation.clothingType || t("Clothes")} ({selectedDonation.quantity || 1} {t("items")})`
);

fs.writeFileSync(file, content);
console.log('Fixed selectedDonation text in AvailableClothes');

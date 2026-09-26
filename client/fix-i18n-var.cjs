const fs = require('fs');

const files = [
  'src/components/ChatBox.jsx',
  'src/components/DonationCard.jsx',
  'src/components/ExploreMap.jsx',
  'src/components/LanguageSelector.jsx',
  'src/components/NotificationDropdown.jsx',
  'src/pages/admin/AdminDashboard.jsx',
  'src/pages/cloth/ClothDonorDashboard.jsx',
  'src/pages/cloth/ClothRequestsReceived.jsx',
  'src/pages/cloth/MyClothRequests.jsx',
  'src/pages/food/DonorDashboard.jsx',
  'src/pages/food/MyRequests.jsx',
  'src/pages/food/ReceiverDashboard.jsx',
  'src/pages/food/RequestsReceived.jsx',
  'src/pages/DonationDetail.jsx',
  'src/pages/ImpactDashboard.jsx',
  'src/pages/PublicProfile.jsx',
  'src/pages/UserDashboard.jsx'
];

for (const file of files) {
  if(!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  const regex = /const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);/g;
  
  if (regex.test(code)) {
    code = code.replace(regex, 'const { t, i18n } = useTranslation();');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log('Fixed', file);
  }
}

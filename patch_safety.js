const fs = require('fs');
let file = 'client/src/pages/cloth/DonateClothForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Safe fallback for currentTypeOptions just in case
content = content.replace(
  /const currentTypeOptions = item\.recipientCategory \? typeOptionsMap\[item\.recipientCategory\] : \[\];/,
  'const currentTypeOptions = (item.recipientCategory && typeOptionsMap[item.recipientCategory]) ? typeOptionsMap[item.recipientCategory] : [];'
);

fs.writeFileSync(file, content);

const fs = require('fs');
const file = 'utils/clothFallbackScheduler.js';
let c = fs.readFileSync(file, 'utf8');

const regex = /const runClothFallbackCheck = async \(io\) => {[\s\S]*?};\n/g;

const replacement = `const runClothFallbackCheck = async (io) => {
  // Clothes no longer have expiryTime or responseDeadline.
  // We explicitly disable urgency alerts, automatic expiry, and automatic fallback for Clothes.
  return;
};
`;

c = c.replace(regex, replacement);
fs.writeFileSync(file, c);

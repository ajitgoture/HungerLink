const fs = require('fs');
const path = require('path');

const localesDir = path.resolve('src/locales');
const enPath = path.join(localesDir, 'en.json');
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!en.status.HANDOVER_PENDING) {
  en.status.HANDOVER_PENDING = 'Pending Verification';
  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  console.log('Added HANDOVER_PENDING to en.json');
}

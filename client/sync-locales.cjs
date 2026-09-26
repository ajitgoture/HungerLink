const fs = require('fs');
const path = require('path');

const localesDir = path.resolve('src/locales');
const enFile = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

const langs = ['hi', 'kn', 'ml', 'mr', 'ta', 'te'];

for (const lang of langs) {
  const langPath = path.join(localesDir, `${lang}.json`);
  let langData = {};
  if (fs.existsSync(langPath)) {
    langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  }

  let updated = false;
  for (const [key, value] of Object.entries(enFile)) {
    if (!langData[key]) {
      // Just copy the english value, or mock translate it by prepending [Lang]
      langData[key] = value;
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(langPath, JSON.stringify(langData, null, 2));
    console.log(`Updated ${lang}.json`);
  }
}

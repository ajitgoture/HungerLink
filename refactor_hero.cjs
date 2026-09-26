const fs = require('fs');

let c = fs.readFileSync('client/src/pages/Home.jsx', 'utf8');

// 1. Refactor HERO_SLIDES
c = c.replace(/label: t\("Feeding communities, one meal at a time."\)/g, "labelKey: 'home.hero.slide1'");
c = c.replace(/label: t\("Fresh food delivered with compassion."\)/g, "labelKey: 'home.hero.slide2'");
c = c.replace(/label: t\("Clothes that warm hearts and bodies."\)/g, "labelKey: 'home.hero.slide3'");
c = c.replace(/\{HERO_SLIDES\[slide\]\.label\}/g, "{t(HERO_SLIDES[slide].labelKey)}");

// 2. Refactor Badge
c = c.replace(/\{t\("HungerLink [^"]* Live Community Network"\)\}/g, '{t("home.hero.badge")}');

// 3. Refactor Title
c = c.replace(/\{t\("Your little,"\)\}/g, '{t("home.hero.titlePart1")}');
c = c.replace(/\{t\("someone's plenty."\)\}/g, '{t("home.hero.titlePart2")}');

// 4. Refactor Description
c = c.replace(/\{t\("Connecting food & clothes donors directly with people in need [^"]* no middlemen, no delays, real-time."\)\}/g, '{t("home.hero.description")}');

fs.writeFileSync('client/src/pages/Home.jsx', c);
console.log('Refactored Home.jsx strings to structural keys!');

// Update en.json and kn.json
const enPath = 'client/src/locales/en.json';
const knPath = 'client/src/locales/kn.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let kn = JSON.parse(fs.readFileSync(knPath, 'utf8'));

en['home.hero.slide1'] = "Feeding communities, one meal at a time.";
en['home.hero.slide2'] = "Fresh food delivered with compassion.";
en['home.hero.slide3'] = "Clothes that warm hearts and bodies.";
en['home.hero.badge'] = "HungerLink · Live Community Network";
en['home.hero.titlePart1'] = "Your little,";
en['home.hero.titlePart2'] = "someone's plenty.";
en['home.hero.description'] = "Connecting food & clothes donors directly with people in need — no middlemen, no delays, real-time.";

kn['home.hero.slide1'] = "ಸಮುದಾಯಗಳಿಗೆ ಆಹಾರ ನೀಡುವುದು, ಒಂದು ಬಾರಿಗೆ ಒಂದು ಊಟ.";
kn['home.hero.slide2'] = "ಕರುಣೆಯಿಂದ ವಿತರಿಸಲಾದ ತಾಜಾ ಆಹಾರ.";
kn['home.hero.slide3'] = "ಹೃದಯ ಮತ್ತು ದೇಹವನ್ನು ಬೆಚ್ಚಗಾಗಿಸುವ ಬಟ್ಟೆಗಳು.";
kn['home.hero.badge'] = "ಹಂಗರ್‌ಲಿಂಕ್ · ಲೈವ್ ಕಮ್ಯುನಿಟಿ ನೆಟ್‌ವರ್ಕ್";
kn['home.hero.titlePart1'] = "ನಿಮ್ಮ ಸ್ವಲ್ಪ,";
kn['home.hero.titlePart2'] = "ಯಾರದ್ದೋ ಸಮೃದ್ಧಿ.";
kn['home.hero.description'] = "ಆಹಾರ ಮತ್ತು ಬಟ್ಟೆ ದಾನಿಗಳನ್ನು ನೇರವಾಗಿ ಅಗತ್ಯವಿರುವವರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವುದು — ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲ, ವಿಳಂಬವಿಲ್ಲ, ನೈಜ-ಸಮಯ.";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(knPath, JSON.stringify(kn, null, 2));
console.log('Updated en.json and kn.json');

const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');
const pEn = 'src/locales/en.json';
const pKn = 'src/locales/kn.json';
let en = JSON.parse(fs.readFileSync(pEn));
let kn = JSON.parse(fs.readFileSync(pKn));
let c = fs.readFileSync('src/pages/Home.jsx', 'utf8');

let match;
let regex = /t\(['"`](.*?)['"`]\)/g;
let promises = [];

while ((match = regex.exec(c)) !== null) {
  let key = match[1];
  if (!en[key]) en[key] = key;
  if (!kn[key] || kn[key] === key) {
    if (/[a-zA-Z]/.test(key)) {
      promises.push((async () => {
        try {
          const res = await translate(key, { to: 'kn' });
          if (res && res.text) kn[key] = res.text;
          console.log('Translated: ' + key + ' -> ' + res.text);
        } catch(e) {
          kn[key] = key;
        }
      })());
    }
  }
}
Promise.all(promises).then(() => {
  fs.writeFileSync(pEn, JSON.stringify(en, null, 2));
  fs.writeFileSync(pKn, JSON.stringify(kn, null, 2));
  console.log('Added and translated new Home.jsx keys.');
});

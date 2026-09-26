const fs = require('fs');
const { translate } = require('bing-translate-api');

const targetLang = process.argv[2];
const enPath = 'src/locales/en.json';
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const enKeys = Object.keys(en).filter(k => typeof en[k] === 'string');

async function translateBatch(texts, toLang) {
  const joined = texts.join(' ||| ');
  try {
    const res = await translate(joined, null, toLang);
    const translated = res.translation.split(/\|\|\|/g).map(s => s.trim());
    if (translated.length !== texts.length) throw new Error('Mismatch');
    return translated;
  } catch (err) {
    const fallback = [];
    for (const text of texts) {
      try {
        const r = await translate(text, null, toLang);
        fallback.push(r.translation);
      } catch(e) {
        fallback.push(text);
      }
    }
    return fallback;
  }
}

async function run() {
  const filePath = `src/locales/${targetLang}.json`;
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const missingKeys = [];
  for (const key of enKeys) {
    if (!data[key] || (data[key] === en[key] && data[key].length > 3)) {
       missingKeys.push(key);
    }
  }
  
  console.log(`Found ${missingKeys.length} missing keys in ${targetLang}.`);
  const BATCH_SIZE = 20;
  
  for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
    const batchKeys = missingKeys.slice(i, i + BATCH_SIZE);
    const batchTexts = batchKeys.map(k => en[k]);
    const translatedTexts = await translateBatch(batchTexts, targetLang);
    for (let j = 0; j < batchKeys.length; j++) {
      data[batchKeys[j]] = translatedTexts[j] || batchTexts[j];
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    await new Promise(r => setTimeout(r, 200)); // Faster sleep
  }
  console.log(`${targetLang} completed.`);
}

run().catch(console.error);

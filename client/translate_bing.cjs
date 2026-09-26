const fs = require('fs');
const { translate } = require('bing-translate-api');

const langs = ['kn', 'hi', 'ml', 'mr', 'ta', 'te'];
const enPath = 'src/locales/en.json';
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Only grab the flat keys that are strings
const enKeys = Object.keys(en).filter(k => typeof en[k] === 'string');

async function translateBatch(texts, toLang) {
  const joined = texts.join(' ||| ');
  try {
    const res = await translate(joined, null, toLang);
    const translated = res.translation.split(/\|\|\|/g).map(s => s.trim());
    
    // Fallback if split fails
    if (translated.length !== texts.length) {
      console.warn(`Batch split mismatch for ${toLang}! Expected ${texts.length}, got ${translated.length}`);
      // Fallback: translate one by one
      const fallback = [];
      for (const text of texts) {
        try {
          const r = await translate(text, null, toLang);
          fallback.push(r.translation);
          await new Promise(res => setTimeout(res, 200));
        } catch(e) {
          fallback.push(text); // Fallback to english
        }
      }
      return fallback;
    }
    return translated;
  } catch (err) {
    console.error('Batch translation failed:', err.message);
    // Fallback one by one
    const fallback = [];
    for (const text of texts) {
      try {
        const r = await translate(text, null, toLang);
        fallback.push(r.translation);
        await new Promise(res => setTimeout(res, 200));
      } catch(e) {
        fallback.push(text);
      }
    }
    return fallback;
  }
}

async function run() {
  for (const lang of langs) {
    console.log(`\n=== Processing ${lang} ===`);
    const filePath = `src/locales/${lang}.json`;
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Find missing keys
    const missingKeys = [];
    for (const key of enKeys) {
      if (!data[key] || data[key] === en[key]) {
        // Simple heuristic: if it perfectly matches English and is longer than 5 chars, it's probably missing.
        // Or if it's explicitly an empty string.
        if (!data[key] || (data[key] === en[key] && data[key].length > 3)) {
           missingKeys.push(key);
        }
      }
    }
    
    console.log(`Found ${missingKeys.length} missing keys in ${lang}.`);
    
    const BATCH_SIZE = 15;
    for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
      const batchKeys = missingKeys.slice(i, i + BATCH_SIZE);
      const batchTexts = batchKeys.map(k => en[k]);
      
      console.log(`Translating batch ${i} to ${i + batchKeys.length} of ${missingKeys.length}...`);
      
      const translatedTexts = await translateBatch(batchTexts, lang);
      
      for (let j = 0; j < batchKeys.length; j++) {
        data[batchKeys[j]] = translatedTexts[j] || batchTexts[j];
      }
      
      // Save every batch just in case
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      // Sleep slightly to avoid throttling
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log(`${lang} completed.`);
  }
}

run().catch(console.error);

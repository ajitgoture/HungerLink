const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');
const path = require('path');

async function run() {
  const p = path.join(__dirname, 'src', 'locales', 'kn.json');
  const kn = JSON.parse(fs.readFileSync(p, 'utf8'));
  let count = 0;
  const keysToTranslate = [];

  for (const [key, val] of Object.entries(kn)) {
    if (typeof val === 'string' && key === val && /[a-zA-Z]/.test(key)) {
      // Don't translate highly technical strings like toastTitle_...
      if (key.startsWith('toastTitle_') || key.startsWith('toastMsg_') || key === 'application/json') continue;
      keysToTranslate.push(key);
    }
  }

  console.log(`Found ${keysToTranslate.length} English fallback strings to translate to Kannada...`);

  const batchSize = 10;
  for (let i = 0; i < keysToTranslate.length; i += batchSize) {
    const batch = keysToTranslate.slice(i, i + batchSize);
    console.log(`Translating batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(keysToTranslate.length/batchSize)}`);
    
    await Promise.all(batch.map(async (key) => {
      try {
        const res = await translate(key, { to: 'kn' });
        if (res && res.text) {
          kn[key] = res.text;
        }
      } catch (e) {
        console.error(`Failed to translate: ${key}`, e.message);
      }
    }));
    
    // Save periodically
    fs.writeFileSync(p, JSON.stringify(kn, null, 2));
    
    // Tiny delay to respect API limits
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('Finished translating kn.json!');
}

run();

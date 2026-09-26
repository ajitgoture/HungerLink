import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';

const localesDir = path.join(process.cwd(), 'src', 'locales');
if (!fs.existsSync(localesDir)) fs.mkdirSync(localesDir, { recursive: true });
const extracted = JSON.parse(fs.readFileSync('extracted.json', 'utf-8'));
const strings = Object.keys(extracted);

const languages = ['en', 'kn', 'hi', 'ml', 'mr', 'ta', 'te'];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  for (const lang of languages) {
    let existing = {};
    const filePath = path.join(localesDir, lang + '.json');
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    const result = { ...existing };
    let missingStrings = strings.filter(s => !result[s]);

    if (lang === 'en') {
      missingStrings.forEach(s => result[s] = s);
    } else {
      console.log('Translating ' + missingStrings.length + ' strings to ' + lang + '...');
      const CHUNK_SIZE = 50;
      
      for (let i = 0; i < missingStrings.length; i += CHUNK_SIZE) {
        const chunk = missingStrings.slice(i, i + CHUNK_SIZE);
        const query = chunk.join(' ~|~ ');
        try {
          const res = await translate(query, { to: lang });
          // The API sometimes adds spaces around the separator, sometimes not. Let's use regex to split cleanly.
          const translated = res.text.split(/\s*~\|~\s*/);
          
          if (translated.length === chunk.length) {
            chunk.forEach((text, idx) => {
              result[text] = translated[idx].trim();
            });
            console.log('[' + lang + '] Translated chunk ' + (i/CHUNK_SIZE + 1) + ' / ' + Math.ceil(missingStrings.length/CHUNK_SIZE));
          } else {
            console.log('[' + lang + '] Chunk length mismatch. Falling back to individual requests.');
            for (const text of chunk) {
               try {
                 const singleRes = await translate(text, { to: lang });
                 result[text] = singleRes.text;
               } catch (e) {
                 result[text] = text;
               }
               await sleep(100);
            }
          }
        } catch (e) {
          console.error('[' + lang + '] Error on chunk:', e.message);
          chunk.forEach(s => result[s] = s);
        }
        await sleep(300);
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log('Saved ' + lang + '.json');
  }
}
run();

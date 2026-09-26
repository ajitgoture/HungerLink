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
    const filePath = path.join(localesDir, ${lang}.json);
    if (fs.existsSync(filePath)) {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    const result = { ...existing };
    let missingStrings = strings.filter(s => !result[s]);

    if (lang === 'en') {
      missingStrings.forEach(s => result[s] = s);
    } else {
      console.log(Translating  strings to ...);
      const CHUNK_SIZE = 25;
      
      for (let i = 0; i < missingStrings.length; i += CHUNK_SIZE) {
        const chunk = missingStrings.slice(i, i + CHUNK_SIZE);
        const query = chunk.join(' \n\n###\n\n ');
        try {
          const res = await translate(query, { to: lang });
          const translated = res.text.split(/\s*\n\n###\n\n\s*/);
          
          if (translated.length === chunk.length) {
            chunk.forEach((text, idx) => {
              result[text] = translated[idx];
            });
            console.log([] Translated chunk  / );
          } else {
            console.log([] Mismatch in chunk length! Falling back to 1-by-1 for this chunk.);
            for (const text of chunk) {
               try {
                 const singleRes = await translate(text, { to: lang });
                 result[text] = singleRes.text;
               } catch (e) {
                 result[text] = text;
               }
               await sleep(200);
            }
          }
        } catch (e) {
          console.error([] Error on chunk:, e.message);
          chunk.forEach(s => result[s] = s); // fallback
        }
        await sleep(500); // rate limiting
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log(Saved .json);
  }
}
run();

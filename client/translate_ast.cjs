const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { translate } = require('@vitalets/google-translate-api');

const pEn = 'src/locales/en.json';
const pKn = 'src/locales/kn.json';
let en = JSON.parse(fs.readFileSync(pEn, 'utf8'));
let kn = JSON.parse(fs.readFileSync(pKn, 'utf8'));

const keys = new Set();

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      if (!c.includes('t(')) return;
      try {
        const ast = parse(c, { sourceType: 'module', plugins: ['jsx'] });
        traverse(ast, {
          CallExpression(path) {
            if (path.node.callee.name === 't' && path.node.arguments.length > 0) {
              const arg = path.node.arguments[0];
              if (arg.type === 'StringLiteral') {
                keys.add(arg.value);
              }
            }
          }
        });
      } catch (e) {}
    }
  });
}

walk('src');

async function doTranslations() {
  console.log(`Found ${keys.size} unique keys in codebase.`);
  const promises = [];
  
  for (const key of keys) {
    if (!en[key]) en[key] = key;
    if (!kn[key] || kn[key] === key) {
      if (/[a-zA-Z]/.test(key) && !key.startsWith('toastTitle_') && !key.startsWith('toastMsg_')) {
         promises.push((async () => {
            try {
              const res = await translate(key, { to: 'kn' });
              if (res && res.text) {
                kn[key] = res.text;
                console.log(`Translated: "${key}" -> "${res.text}"`);
              }
            } catch(e) {
               kn[key] = key;
            }
         })());
      }
    }
  }
  
  await Promise.all(promises);
  fs.writeFileSync(pEn, JSON.stringify(en, null, 2));
  fs.writeFileSync(pKn, JSON.stringify(kn, null, 2));
  console.log('Complete!');
}

doTranslations();

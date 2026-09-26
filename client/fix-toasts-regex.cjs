const fs = require('fs');
const path = require('path');

const enPath = path.resolve('src/locales/en.json');
let enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function makeKey(str) {
  return str.replace(/[^a-zA-Z0-9]/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
}

function processFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern 1: showToast('Title', 'Message') or showToast('Title', 'Message', 'type')
  // We'll replace the exact matched literal strings.
  const regex = /showToast\(\s*(['"`])(.*?)\1\s*,\s*(['"`])(.*?)\3/g;
  
  code = code.replace(regex, (match, q1, title, q3, message) => {
    changed = true;
    const titleKey = `toastTitle_${makeKey(title)}`;
    const msgKey = `toastMsg_${makeKey(message)}`;
    
    enTranslations[titleKey] = title;
    enTranslations[msgKey] = message;

    return `showToast(t('${titleKey}'), t('${msgKey}')`;
  });

  // Pattern 2: showToast('Title', err... || 'Message')
  const regex2 = /showToast\(\s*(['"`])(.*?)\1\s*,\s*([^,]+?)\s*\|\|\s*(['"`])(.*?)\4/g;
  code = code.replace(regex2, (match, q1, title, variablePart, q4, message) => {
    changed = true;
    const titleKey = `toastTitle_${makeKey(title)}`;
    const msgKey = `toastMsg_${makeKey(message)}`;
    
    enTranslations[titleKey] = title;
    enTranslations[msgKey] = message;

    return `showToast(t('${titleKey}'), ${variablePart} || t('${msgKey}')`;
  });

  // Since we replaced the string inside showToast, we need to ensure the component imports `useTranslation` 
  // and has `const { t } = useTranslation();`
  // Actually I previously injected useTranslation heavily across the app, but just in case:
  if (changed) {
    if (!code.includes('useTranslation')) {
      code = `import { useTranslation } from 'react-i18next';\n` + code;
    }
    // Inject t if missing
    if (!code.includes('const { t }')) {
      // Find component start
      const compMatch = code.match(/const\s+[A-Z]\w*\s*=\s*(?:function)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>\s*\{/);
      if (compMatch) {
         code = code.replace(compMatch[0], compMatch[0] + '\n  const { t } = useTranslation();');
      } else {
         const compMatch2 = code.match(/function\s+[A-Z]\w*\s*\([^)]*\)\s*\{/);
         if (compMatch2) {
             code = code.replace(compMatch2[0], compMatch2[0] + '\n  const { t } = useTranslation();');
         }
      }
    }
    fs.writeFileSync(filePath, code);
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.resolve('src'));

fs.writeFileSync(enPath, JSON.stringify(enTranslations, null, 2));
console.log('Saved en.json');

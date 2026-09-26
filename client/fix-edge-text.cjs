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

  // Regex to find things like >Loading user authentication...< or >Loading clothes donations...<
  const regex = />(Loading[^<]+)</g;
  code = code.replace(regex, (match, p1) => {
    changed = true;
    const key = `loading_${makeKey(p1)}`;
    enTranslations[key] = p1.trim();
    return `>{t('${key}')}<`;
  });

  const regex2 = /title="([^"]+)"/g;
  code = code.replace(regex2, (match, p1) => {
    // Only translate obvious english phrases like "Change Language", etc
    if (p1.includes('Change Language') || p1.includes('Clear filters') || p1.includes('Remove')) {
      changed = true;
      const key = `title_${makeKey(p1)}`;
      enTranslations[key] = p1;
      return `title={t('${key}')}`;
    }
    return match;
  });

  if (changed) {
    if (!code.includes('useTranslation')) {
      code = `import { useTranslation } from 'react-i18next';\n` + code;
    }
    // Inject t if missing
    if (!code.includes('const { t }')) {
      const compMatch = code.match(/const\s+[A-Z]\w*\s*=\s*(?:function)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>\s*\{/);
      if (compMatch) {
         code = code.replace(compMatch[0], compMatch[0] + '\n  const { t } = useTranslation();');
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

const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replacePatterns = [
    { regex: /\.toLocaleDateString\(([^i])/g, replacement: '.toLocaleDateString(i18n.language, $1' },
    { regex: /\.toLocaleDateString\(\)/g, replacement: '.toLocaleDateString(i18n.language)' },
    { regex: /\.toLocaleTimeString\(([^i])/g, replacement: '.toLocaleTimeString(i18n.language, $1' },
    { regex: /\.toLocaleTimeString\(\)/g, replacement: '.toLocaleTimeString(i18n.language)' },
    { regex: /\.toLocaleString\(([^i])/g, replacement: '.toLocaleString(i18n.language, $1' },
    { regex: /\.toLocaleString\(\)/g, replacement: '.toLocaleString(i18n.language)' },
  ];

  for (const { regex, replacement } of replacePatterns) {
    if (regex.test(code)) {
      code = code.replace(regex, replacement);
      changed = true;
    }
  }

  if (changed) {
    // Make sure i18n is destructured from useTranslation
    if (code.includes('const { t } = useTranslation();')) {
      code = code.replace('const { t } = useTranslation();', 'const { t, i18n } = useTranslation();');
    } else if (code.includes('const { t, i18n } = useTranslation();')) {
      // already good
    } else if (code.includes('const { i18n, t } = useTranslation();')) {
      // already good
    } else {
       // if they didn't have useTranslation at all, it's rare.
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

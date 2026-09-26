const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // The first occurrence of `const { t, i18n } = useTranslation();` or `const { t } = useTranslation();` 
  // needs to be kept.
  
  // Actually, the easiest way to fix the duplicate `t` declaration is:
  // 1. Convert all `const {\n  t\n} = useTranslation();` to `const { t } = useTranslation();`
  // 2. Count them.
  // 3. Keep the most complete one (e.g. `const { t, i18n } = useTranslation();`), remove the rest.

  // Normalize formatting for destructuring of useTranslation
  const normalizeRegex = /const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);/g;
  code = code.replace(normalizeRegex, 'const { t } = useTranslation();');

  const normalize2 = /const\s*\{\s*t,\s*i18n\s*\}\s*=\s*useTranslation\(\);/g;
  code = code.replace(normalize2, 'const { t, i18n } = useTranslation();');

  const normalize3 = /const\s*\{\s*i18n,\s*t\s*\}\s*=\s*useTranslation\(\);/g;
  code = code.replace(normalize3, 'const { t, i18n } = useTranslation();');

  // Now, we find all declarations.
  let declarations = [];
  const declRegex = /const\s*\{\s*[^}]*\b(t|i18n)\b[^}]*\}\s*=\s*useTranslation\(\);/g;
  let match;
  while ((match = declRegex.exec(code)) !== null) {
    declarations.push({
      full: match[0],
      index: match.index,
      length: match[0].length
    });
  }

  if (declarations.length > 1) {
    changed = true;
    
    // We want to combine all required variables (t, i18n) into the first declaration, 
    // and remove the subsequent ones.
    let needsT = false;
    let needsI18n = false;
    
    for (let decl of declarations) {
       if (decl.full.includes('t')) needsT = true;
       if (decl.full.includes('i18n')) needsI18n = true;
    }

    let combinedDecl = 'const { ';
    if (needsT) combinedDecl += 't';
    if (needsT && needsI18n) combinedDecl += ', ';
    if (needsI18n) combinedDecl += 'i18n';
    combinedDecl += ' } = useTranslation();';

    // Replace the first one with the combined one
    const first = declarations[0];
    let newCode = code.slice(0, first.index) + combinedDecl + code.slice(first.index + first.length);
    
    // For the remaining ones, we replace them with empty string.
    // Note: We have to iterate backwards so indices don't get messed up.
    for (let i = declarations.length - 1; i > 0; i--) {
       const decl = declarations[i];
       // Recalculate index because we modified the string at first.index
       // Actually, it's easier to just do a global replace of all specific declarations we found,
       // BUT we might accidentally remove the first one. 
       // So we just replace them from the back.
    }
  }

  // Let's use a simpler string replacement strategy since we normalized them:
  if (changed) {
     // Wait, the above logic wasn't fully applied to newCode safely. Let's do it safely.
  }
}

function safeProcess(filePath) {
   let code = fs.readFileSync(filePath, 'utf8');
   let original = code;

   // Normalize
   code = code.replace(/const\s*\{\s*t\s*\}\s*=\s*useTranslation\(\);/g, 'const { t } = useTranslation();');
   code = code.replace(/const\s*\{\s*t,\s*i18n\s*\}\s*=\s*useTranslation\(\);/g, 'const { t, i18n } = useTranslation();');
   code = code.replace(/const\s*\{\s*i18n,\s*t\s*\}\s*=\s*useTranslation\(\);/g, 'const { t, i18n } = useTranslation();');

   const count1 = (code.match(/const \{ t \} = useTranslation\(\);/g) || []).length;
   const count2 = (code.match(/const \{ t, i18n \} = useTranslation\(\);/g) || []).length;

   if (count1 + count2 > 1) {
       // We have duplicates!
       // Remove all of them
       code = code.replace(/const \{ t \} = useTranslation\(\);/g, '');
       code = code.replace(/const \{ t, i18n \} = useTranslation\(\);/g, '');
       
       // Inject one `const { t, i18n } = useTranslation();` right after the component declaration
       const compMatch = code.match(/const\s+[A-Z]\w*\s*=\s*(?:function)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>\s*\{/);
       if (compMatch) {
         code = code.replace(compMatch[0], compMatch[0] + '\n  const { t, i18n } = useTranslation();');
       } else {
         const compMatch2 = code.match(/function\s+[A-Z]\w*\s*\([^)]*\)\s*\{/);
         if (compMatch2) {
             code = code.replace(compMatch2[0], compMatch2[0] + '\n  const { t, i18n } = useTranslation();');
         } else if (code.includes('export default function')) {
             const m = code.match(/export default function\s+[A-Z]\w*\s*\([^)]*\)\s*\{/);
             if (m) code = code.replace(m[0], m[0] + '\n  const { t, i18n } = useTranslation();');
         }
       }
       fs.writeFileSync(filePath, code);
       console.log(`Fixed duplicates in ${filePath}`);
   }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      safeProcess(fullPath);
    }
  }
}

walkDir(path.resolve('src'));

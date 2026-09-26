const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const badUsages = [];

function isUIString(str) {
  str = str.trim();
  // Too short to be meaningful UI text, or mostly symbols
  if (str.length < 2) return false;
  // Ignore URLs, file paths, CSS, module types, generic technical terms
  if (str.startsWith('/') || str.startsWith('http') || str.startsWith('w-') || str.startsWith('bg-') || str.startsWith('text-')) return false;
  if (/^[A-Z0-9_]+$/.test(str)) return false; // Enums like AVAILABLE
  if (['food', 'cloth', 'Food Donor', 'Food Receiver', 'Cloth Donor', 'Cloth Receiver'].includes(str)) return false; 
  if (str === 'application/json' || str === 'multipart/form-data') return false;
  
  // Contains at least one letter
  if (!/[a-zA-Z]/.test(str)) return false;
  
  return true;
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== 'assets') walk(p);
    } else if (p.endsWith('.jsx')) {
      const c = fs.readFileSync(p, 'utf8');
      try {
        const ast = parse(c, { sourceType: 'module', plugins: ['jsx'] });
        traverse(ast, {
          JSXText(path) {
            const text = path.node.value;
            if (isUIString(text)) {
              badUsages.push(`[JSXText] ${p}: "${text.trim()}"`);
            }
          },
          JSXAttribute(path) {
            const name = path.node.name.name;
            if (['placeholder', 'title', 'aria-label', 'alt', 'label'].includes(name)) {
              if (path.node.value && path.node.value.type === 'StringLiteral') {
                const text = path.node.value.value;
                if (isUIString(text)) {
                  badUsages.push(`[JSXAttribute - ${name}] ${p}: "${text}"`);
                }
              }
            }
          }
        });
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
}

walk('src');
console.log(`Found ${badUsages.length} hardcoded strings.`);
if (badUsages.length > 0) {
  console.log(badUsages.join('\n'));
}

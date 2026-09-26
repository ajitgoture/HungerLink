const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

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
  const code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee.name === 'showToast') {
        const args = path.node.arguments;
        
        if (args[0] && args[0].type === 'StringLiteral') {
          const original = args[0].value;
          const key = `toastTitle_${makeKey(original)}`;
          enTranslations[key] = original;
          
          args[0] = {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 't' },
            arguments: [{ type: 'StringLiteral', value: key }]
          };
          changed = true;
        }

        if (args[1] && args[1].type === 'StringLiteral') {
          const original = args[1].value;
          const key = `toastMsg_${makeKey(original)}`;
          enTranslations[key] = original;
          
          args[1] = {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 't' },
            arguments: [{ type: 'StringLiteral', value: key }]
          };
          changed = true;
        } else if (args[1] && args[1].type === 'LogicalExpression' && args[1].operator === '||') {
            if (args[1].right.type === 'StringLiteral') {
              const original = args[1].right.value;
              const key = `toastMsg_${makeKey(original)}`;
              enTranslations[key] = original;

              args[1].right = {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 't' },
                arguments: [{ type: 'StringLiteral', value: key }]
              };
              changed = true;
            }
        }
      }
    }
  });

  if (changed) {
    const output = generator(ast, {}, code);
    fs.writeFileSync(filePath, output.code);
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

import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generator from '@babel/generator';

// Path to en.json
const enPath = path.resolve('src/locales/en.json');
let enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to convert string to camelCase key
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

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  traverse.default(ast, {
    CallExpression(path) {
      if (path.node.callee.name === 'showToast') {
        const args = path.node.arguments;
        
        // Handle arg 0 (Title)
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

        // Handle arg 1 (Message)
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
            // Handle: err.response?.data?.message || 'Fallback string'
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
    const output = generator.default(ast, {}, code);
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

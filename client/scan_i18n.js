import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

// Deal with commonjs vs module exports for babel traverse
const traverse = traverseModule.default || traverseModule;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.jsx')) {
      callback(path.resolve(dirPath));
    }
  });
}

const ignoreList = ['lucide-react', 'react', 'react-router-dom', 'axios', 'socket.io-client', 'i18next'];
const filesWithHardcoded = {};

walkDir('./src', (filePath) => {
  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (e) {
    return;
  }

  const hardcoded = [];
  
  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.trim();
      if (!text || !/[a-zA-Z]/.test(text)) return;
      hardcoded.push(`JSXText: "${text}"`);
    },
    JSXAttribute(path) {
      const attrName = path.node.name.name;
      // Exclude generic react/html attrs that aren't user visible usually, except these:
      if (['placeholder', 'title', 'alt', 'aria-label', 'label', 'description', 'message'].includes(attrName)) {
        if (path.node.value && path.node.value.type === 'StringLiteral') {
          const text = path.node.value.value.trim();
          if (text && /[a-zA-Z]/.test(text)) {
            hardcoded.push(`JSXAttr [${attrName}]: "${text}"`);
          }
        } else if (path.node.value && path.node.value.type === 'JSXExpressionContainer') {
             if (path.node.value.expression.type === 'StringLiteral') {
                 const text = path.node.value.expression.value.trim();
                 if (text && /[a-zA-Z]/.test(text)) {
                     hardcoded.push(`JSXAttr [${attrName}]: "${text}"`);
                 }
             }
        }
      }
    },
    StringLiteral(path) {
        // If string is inside an array, maybe it's a dropdown option
        if (path.parent.type === 'ArrayExpression') {
             // Look for obvious UI strings
             const text = path.node.value.trim();
             if (text.length > 2 && /[A-Z]/.test(text[0])) {
                 // Check if it's not a generic configuration key
                 if (!['admin', 'Food Donor', 'Food Receiver', 'Cloth Donor', 'Cloth Receiver'].includes(text)) {
                     // hardcoded.push(`ArrayString: "${text}"`); // Might be too noisy
                 }
             }
        }
    },
    CallExpression(path) {
      if (path.node.callee.type === 'Identifier') {
        const name = path.node.callee.name;
        if (['toast', 'showToast', 'setError', 'setSuccess', 'alert'].includes(name)) {
          path.node.arguments.forEach(arg => {
            if (arg.type === 'StringLiteral') {
               hardcoded.push(`${name}(): "${arg.value}"`);
            }
          });
        }
      }
    }
  });

  if (hardcoded.length > 0) {
    filesWithHardcoded[filePath.replace(process.cwd(), '')] = hardcoded;
  }
});

fs.writeFileSync('i18n_report.json', JSON.stringify(filesWithHardcoded, null, 2));
console.log('Found hardcoded strings in ' + Object.keys(filesWithHardcoded).length + ' files');

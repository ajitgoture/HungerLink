const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverseModule = require('@babel/traverse');
const traverse = traverseModule.default || traverseModule;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
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
    ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) { return; }

  const hardcoded = [];
  
  traverse(ast, {
    StringLiteral(path) {
        const text = path.node.value.trim();
        if (text.length < 3 || !/[a-zA-Z]/.test(text)) return; // Ignore small/empty strings
        
        // Exclude generic react/html attrs, CSS classes, URLs, imports
        if (path.parent.type === 'ImportDeclaration') return;
        if (path.parent.type === 'CallExpression' && path.parent.callee.name === 'require') return;
        if (path.parent.type === 'JSXAttribute' && ['className', 'type', 'name', 'id', 'src', 'to', 'key', 'variant', 'size', 'role', 'value'].includes(path.parent.name.name)) return;
        if (path.parent.type === 'JSXAttribute' && path.parent.name.name.startsWith('data-')) return;
        if (text.startsWith('/')) return; // Routes
        if (text.includes('text-') || text.includes('bg-')) return; // Tailwind
        
        // Exclude if inside t()
        if (path.parent.type === 'CallExpression' && path.parent.callee.name === 't') return;
        
        // Exclude Object properties keys like { title: '...' } unless the value is UI facing.
        if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node) return;
        
        // If it's a known generic technical word, ignore
        if (['application/json', 'multipart/form-data', 'admin', 'Food Donor', 'Food Receiver', 'Cloth Donor', 'Cloth Receiver'].includes(text)) return;
        
        // If we reach here, it's a string literal that might be UI facing
        hardcoded.push(`StringLiteral: "${text}" (Parent: ${path.parent.type})`);
    },
    JSXText(path) {
      const text = path.node.value.trim();
      if (!text || !/[a-zA-Z]/.test(text)) return;
      hardcoded.push(`JSXText: "${text}"`);
    }
  });

  if (hardcoded.length > 0) {
    filesWithHardcoded[filePath.replace(process.cwd(), '')] = hardcoded;
  }
});

fs.writeFileSync('deep_report.json', JSON.stringify(filesWithHardcoded, null, 2));
console.log('Found potential strings in ' + Object.keys(filesWithHardcoded).length + ' files');

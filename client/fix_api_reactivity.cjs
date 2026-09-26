const fs = require('fs');
const path = require('path');

function replaceAll(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      replaceAll(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      const original = c;
      
      c = c.replace(/setError\(err\.response\?\.data\?\.message\s*\?\s*t\(err\.response\.data\.message\)\s*:\s*t\((['"`].*?['"`])\)\)/g, 'setError(err.response?.data?.message || $1)');
      
      if (c !== original) {
        fs.writeFileSync(p, c);
        console.log('Fixed API Error Reactivity in ' + p);
      }
    }
  });
}
replaceAll('src');

const fs = require('fs');
const path = require('path');

function replaceAll(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) replaceAll(p);
    else if (p.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      const original = c;
      
      c = c.replace(/title:\s*(['"`])([^'"`]+)\1/g, 'title: t("$2")');
      c = c.replace(/description:\s*(['"`])([^'"`]+)\1/g, 'description: t("$2")');
      c = c.replace(/desc:\s*(['"`])([^'"`]+)\1/g, 'desc: t("$2")');
      
      if (c !== original) {
        fs.writeFileSync(p, c);
        console.log('Fixed title/desc array in ' + p);
      }
    }
  });
}
replaceAll('client/src');

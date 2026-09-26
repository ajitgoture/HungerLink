const fs = require('fs');
const path = require('path');

function replaceAll(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) replaceAll(p);
    else if (p.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      const original = c;
      
      // Fix label: 'Something' -> label: t('Something')
      c = c.replace(/label:\s*(['"`])([^'"`]+)\1/g, 'label: t("$2")');
      
      if (c !== original) {
        fs.writeFileSync(p, c);
        console.log('Fixed label array in ' + p);
      }
    }
  });
}
replaceAll('client/src');

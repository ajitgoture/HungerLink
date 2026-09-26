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
      
      // Fix showToast(t(...), t(...)) -> showToast(..., ...)
      // This is a bit complex regex:
      // showToast(t('a'), t('b'))
      c = c.replace(/showToast\(\s*t\((['"`].*?['"`])\)\s*,\s*t\((['"`].*?['"`])\)\s*(?:,\s*['"`].*?['"`])?\s*\)/g, 'showToast($1, $2)');
      c = c.replace(/showToast\(\s*t\((['"`].*?['"`])\)\s*,\s*(.*?)\s*\)/g, 'showToast($1, $2)');

      // Fix render
      if (p.includes('NotificationContext.jsx')) {
          c = c.replace(/>\{toastAlert\.title\}</g, '>{t(toastAlert.title)}<');
          c = c.replace(/>\{toastAlert\.message\}</g, '>{t(toastAlert.message)}<');
      }
      
      if (c !== original) {
        fs.writeFileSync(p, c);
        console.log('Fixed showToast Reactivity in ' + p);
      }
    }
  });
}
replaceAll('src');

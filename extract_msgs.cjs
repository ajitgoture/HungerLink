const fs = require('fs');
const path = require('path');

const msgs = new Set();
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      
      // Match res.status(xx).json({ message: '...' })
      const matches = c.match(/message:\s*['"]([^'"]+)['"]/g);
      if (matches) {
        matches.forEach(m => {
          msgs.add(m.replace(/message:\s*['"]|['"]$/g, ''));
        });
      }
      
      // Also match Notification.create({ message: '...' }) or similar
      const notifMatches = c.match(/(?:message|title):\s*['"]([^'"]+)['"]/g);
      if (notifMatches) {
        notifMatches.forEach(m => {
          msgs.add(m.replace(/(?:message|title):\s*['"]|['"]$/g, ''));
        });
      }
    }
  });
}
walk('server');
console.log(Array.from(msgs).join('\n'));

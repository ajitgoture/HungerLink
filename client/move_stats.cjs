const fs = require('fs');
let c = fs.readFileSync('src/pages/Home.jsx', 'utf8');

const statsRegex = /\{\/\* =+\r?\n\s*STATS BAR\r?\n\s*=+\s*\*\/\}\r?\n\s*<section className="bg-slate-900 text-white py-10">[\s\S]*?<\/section>/;

const match = c.match(statsRegex);
if (!match) {
  console.log('STATS BAR not found');
  process.exit(1);
}

const statsBlock = match[0];
c = c.replace(statsRegex, ''); // Remove from top

const ctaRegex = /(<section className="relative py-32 overflow-hidden">[\s\S]*?<\/section>)/;
if (!c.match(ctaRegex)) {
  console.log('CTA not found');
  process.exit(1);
}

c = c.replace(ctaRegex, '$1\n\n        ' + statsBlock);
fs.writeFileSync('src/pages/Home.jsx', c);
console.log('Moved stats block successfully!');

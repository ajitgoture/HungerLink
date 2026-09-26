const fs = require('fs');

let content = fs.readFileSync('server/test_qr_e2e.js', 'utf8');

content = content.replace(
  `if (qr1.data.token === qr2.data.token) {`,
  `console.log('QR1:', qr1.data); console.log('QR2:', qr2.data);\n    if (qr1.data.token === qr2.data.token) {`
);

fs.writeFileSync('server/test_qr_e2e.js', content);
console.log('Patched test_qr_e2e.js');

const fs = require('fs');
let c = fs.readFileSync('src/pages/food/DonateFoodForm.jsx', 'utf8');

const unitOptionsMatch = c.match(/\/\/ Full unit options list\nconst UNIT_OPTIONS = \[[\s\S]*?\];/);
if (unitOptionsMatch) {
  c = c.replace(unitOptionsMatch[0], '');
  c = c.replace(/const DonateFoodForm = \(\) => {/, 'const DonateFoodForm = () => {\n  ' + unitOptionsMatch[0]);
}

c = c.replace(/label: "([^"]+)"/g, 'label: t("$1")');

fs.writeFileSync('src/pages/food/DonateFoodForm.jsx', c);
console.log('Fixed DonateFoodForm labels');

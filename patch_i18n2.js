const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client/src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = [
  "Condition is required"
];

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  newKeys.forEach(key => {
    if (!data[key]) {
      data[key] = key;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
});

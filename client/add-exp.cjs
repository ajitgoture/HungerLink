const fs = require('fs');
let en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf-8'));
if(!en['Exp:']) en['Exp:'] = 'Exp:';
if(!en['Listed:']) en['Listed:'] = 'Listed:';
fs.writeFileSync('src/locales/en.json', JSON.stringify(en, null, 2));

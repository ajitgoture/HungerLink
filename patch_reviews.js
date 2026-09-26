const fs = require('fs');

let content = fs.readFileSync('server/test_phase6.js', 'utf8');

content = content.replace(/\/reviews/g, '/reviews/submit');

fs.writeFileSync('server/test_phase6.js', content);

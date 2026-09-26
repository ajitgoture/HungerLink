const fs = require('fs');

let content = fs.readFileSync('server/test_sockets_e2e.js', 'utf8');
content = content.replace(/\.\/server\//g, './');
fs.writeFileSync('server/test_sockets_e2e.js', content);
console.log('Fixed paths');

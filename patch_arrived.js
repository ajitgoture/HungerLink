const fs = require('fs');
let content = fs.readFileSync('server/test_qr_e2e.js', 'utf8');

content = content.replace(
  `console.log('HANDOVER:', await apiCall(\`/transfer/\${moduleType}/\${donationId}/handover\`, 'PATCH', donorToken));`,
  `console.log('ARRIVED:', await apiCall(\`/transfer/\${moduleType}/\${donationId}/arrived\`, 'PATCH', receiverToken));\n    console.log('HANDOVER:', await apiCall(\`/transfer/\${moduleType}/\${donationId}/handover\`, 'PATCH', donorToken));`
);

fs.writeFileSync('server/test_qr_e2e.js', content);

const fs = require('fs');
let content = fs.readFileSync('server/test_qr_e2e.js', 'utf8');

content = content.replace(
  `await apiCall(\`/\${moduleType}/requests/\${requestId}/accept\`, 'PATCH', donorToken);`,
  `console.log('ACCEPT:', await apiCall(\`/\${moduleType}/requests/\${requestId}/accept\`, 'PATCH', donorToken));`
).replace(
  `await apiCall(\`/transfer/\${moduleType}/\${donationId}/method\`, 'POST', receiverToken, { method: 'PICKUP', details: 'Coming now' });`,
  `console.log('METHOD:', await apiCall(\`/transfer/\${moduleType}/\${donationId}/method\`, 'POST', receiverToken, { method: 'PICKUP', details: 'Coming now' }));`
).replace(
  `await apiCall(\`/transfer/\${moduleType}/\${donationId}/handover\`, 'PATCH', donorToken);`,
  `console.log('HANDOVER:', await apiCall(\`/transfer/\${moduleType}/\${donationId}/handover\`, 'PATCH', donorToken));`
);

fs.writeFileSync('server/test_qr_e2e.js', content);

const fs = require('fs'); 
let content = fs.readFileSync('src/components/TransferTimeline.jsx', 'utf-8'); 

const clientOld = `<QRCodeSVG value={JSON.stringify({ donationId: donation._id, token: tokenInfo.token })} size={180} level="H" />`;
const clientNew = `<QRCodeSVG value={tokenInfo.qrPayload || JSON.stringify({ donationId: donation._id, token: tokenInfo.token, purpose: 'HungerLink_Handover_Verification' })} size={180} level="H" />`;

content = content.replace(clientOld, clientNew);
fs.writeFileSync('src/components/TransferTimeline.jsx', content);

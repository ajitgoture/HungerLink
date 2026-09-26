const fs = require('fs');
let s = fs.readFileSync('client/src/pages/DonationDetail.jsx', 'utf8');

s = s.replace("import api from '../services/api';", "import api from '../services/api';\nimport { socket } from '../services/socket';");

const effect = `  useEffect(() => {
    const handleUpdate = () => {
      api.get(\`/\${type}/donations/\${id}\`).then(res => setDonation(res.data)).catch(e => console.log(e));
    };
    socket.on('TRANSFER_UPDATE', handleUpdate);
    socket.on('FOOD_REQUESTED', handleUpdate);
    socket.on('CLOTH_REQUESTED', handleUpdate);
    socket.on('REQUEST_ACCEPTED', handleUpdate);
    socket.on('CLOTH_REQUEST_ACCEPTED', handleUpdate);
    socket.on('DONATION_COMPLETED', handleUpdate);
    socket.on('CLOTH_DONATION_COMPLETED', handleUpdate);
    return () => {
      socket.off('TRANSFER_UPDATE', handleUpdate);
      socket.off('FOOD_REQUESTED', handleUpdate);
      socket.off('CLOTH_REQUESTED', handleUpdate);
      socket.off('REQUEST_ACCEPTED', handleUpdate);
      socket.off('CLOTH_REQUEST_ACCEPTED', handleUpdate);
      socket.off('DONATION_COMPLETED', handleUpdate);
      socket.off('CLOTH_DONATION_COMPLETED', handleUpdate);
    };
  }, [type, id]);

`;

s = s.replace("  const handleRequest = async () => {", effect + "  const handleRequest = async () => {");
fs.writeFileSync('client/src/pages/DonationDetail.jsx', s);

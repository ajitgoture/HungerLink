const fs = require('fs');
let s = fs.readFileSync('server/controllers/transferController.js', 'utf8');

const start = s.indexOf('const notifyTransferUpdate');
const end = s.indexOf('const validateParticipant');

const replacement = `const notifyBothParticipants = async (req, donation, title, message) => {
  const donorId = donation.donor._id?.toString() || donation.donor.toString();
  const receiverId = donation.acceptedReceiver?._id?.toString() || donation.acceptedReceiver?.toString();
  const io = req.app.get('socketio');
  
  for (const recipientId of [donorId, receiverId]) {
    if (!recipientId) continue;
    const notif = await Notification.create({
      recipient: recipientId,
      type: 'TRANSFER_UPDATE',
      title,
      message,
      relatedDonation: donation._id
    });
    
    if (io) {
      io.to(\`user_\${recipientId}\`).emit('notification:new', notif);
      io.to(\`user_\${recipientId}\`).emit('TRANSFER_UPDATE', { message });
    }
  }
};

` + s.substring(start, end);

s = s.replace(s.substring(start, end), replacement);
fs.writeFileSync('server/controllers/transferController.js', s);

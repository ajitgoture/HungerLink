const fs = require('fs');
const pathFood = 'server/controllers/foodDonationController.js';
let contentFood = fs.readFileSync(pathFood, 'utf8');

if (!contentFood.includes('Nearby Receivers Notification')) {
  contentFood = contentFood.replace(
    /const io = req\.app\.get\('socketio'\);\s+if \(io\) \{\s+io\.emit\('NEW_FOOD_DONATION', populatedDonation\);\s+\}/,
    `const io = req.app.get('socketio');
      if (io) {
        io.emit('NEW_FOOD_DONATION', populatedDonation);
      }

      // Nearby Receivers Notification
      try {
        const User = require('../models/User');
        const nearbyReceivers = await User.find({ role: 'Food Receiver', city: city });
        
        const receiverNotifs = nearbyReceivers.map(r => ({
          recipient: r._id,
          title: 'New Food Alert! o"',
          message: \`A new food donation "\${effectiveFoodName}" is available near you in \${city}.\`,
          type: 'FOOD_DONATION_POSTED',
          relatedDonation: donation._id,
        }));
        
        if (receiverNotifs.length > 0) {
          const insertedNotifs = await Notification.insertMany(receiverNotifs);
          if (io) {
            insertedNotifs.forEach(notif => {
              io.to(\`user_\${notif.recipient.toString()}\`).emit('notification:new', notif);
            });
          }
        }
      } catch (err) {
        console.error('Error notifying nearby receivers:', err.message);
      }`
  );
  fs.writeFileSync(pathFood, contentFood);
  console.log('Patched foodDonationController.js for receiver notifications.');
}

const pathCloth = 'server/controllers/clothDonationController.js';
let contentCloth = fs.readFileSync(pathCloth, 'utf8');

if (!contentCloth.includes('Nearby Receivers Notification')) {
  contentCloth = contentCloth.replace(
    /const io = req\.app\.get\('socketio'\);\s+if \(io\) \{\s+io\.emit\('cloth:donation-created', populatedDonation\);\s+\}/,
    `const io = req.app.get('socketio');
      if (io) {
        io.emit('cloth:donation-created', populatedDonation);
      }

      // Nearby Receivers Notification
      try {
        const User = require('../models/User');
        const nearbyReceivers = await User.find({ role: { $in: ['Cloth Receiver', 'Clothes Receiver'] }, city: city });
        
        const receiverNotifs = nearbyReceivers.map(r => ({
          recipient: r._id,
          title: 'New Clothes Alert! dY"',
          message: \`A new clothes donation (\${effectiveTotalQuantity} items) is available near you in \${city}.\`,
          type: 'CLOTH_DONATION_POSTED',
          relatedDonation: donation._id,
        }));
        
        if (receiverNotifs.length > 0) {
          const insertedNotifs = await Notification.insertMany(receiverNotifs);
          if (io) {
            insertedNotifs.forEach(notif => {
              io.to(\`user_\${notif.recipient.toString()}\`).emit('notification:new', notif);
            });
          }
        }
      } catch (err) {
        console.error('Error notifying nearby receivers:', err.message);
      }`
  );
  fs.writeFileSync(pathCloth, contentCloth);
  console.log('Patched clothDonationController.js for receiver notifications.');
}

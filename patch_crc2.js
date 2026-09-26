const fs = require('fs');
let s = fs.readFileSync('server/controllers/clothRequestController.js', 'utf8');

const target = 'const existingRequest';
const replacement = `if (req.body.requestedItems && req.body.requestedItems.length > 0) {
      for (let reqItem of req.body.requestedItems) {
        const itemDoc = donation.items.id ? donation.items.id(reqItem.itemId) : donation.items.find(i => i._id.toString() === reqItem.itemId.toString());
        if (!itemDoc || reqItem.quantity <= 0 || reqItem.quantity > itemDoc.quantity) {
          return res.status(400).json({ message: 'Invalid requested items or quantities.' });
        }
      }
    }

    const existingRequest`;

s = s.replace(target, replacement);
fs.writeFileSync('server/controllers/clothRequestController.js', s);

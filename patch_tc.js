const fs = require('fs');
let s = fs.readFileSync('server/controllers/transferController.js', 'utf8');

const start = s.indexOf('if (activeRequest) {');
const end = s.indexOf('donation.completedAt = new Date();\n    }', start);
const target = s.substring(start, end + 'donation.completedAt = new Date();\n    }'.length);

const replacement = `if (activeRequest) {
      activeRequest.status = 'COMPLETED';
      activeRequest.completedAt = new Date();
      await activeRequest.save();
      
      let fullyClaimed = true;
      let weight = 0;
      let clothesItems = 0;

      if (moduleType === 'food') {
        const reqQty = activeRequest.requestedQuantity || donation.quantity;
        weight = reqQty;
        
        if (reqQty < donation.quantity) {
          donation.quantity -= reqQty;
          fullyClaimed = false;
        } else {
          donation.quantity = 0;
        }
      } else if (moduleType === 'cloth') {
        if (activeRequest.requestedItems && activeRequest.requestedItems.length > 0) {
          let totalRemaining = 0;
          
          activeRequest.requestedItems.forEach(reqItem => {
            const itemDoc = donation.items.id ? donation.items.id(reqItem.itemId) : donation.items.find(i => i._id.toString() === reqItem.itemId.toString());
            if (itemDoc) {
              clothesItems += reqItem.quantity;
              itemDoc.quantity = Math.max(0, itemDoc.quantity - reqItem.quantity);
            }
          });

          donation.items.forEach(item => {
            totalRemaining += item.quantity;
          });
          
          if (totalRemaining > 0) {
            fullyClaimed = false;
          }
        } else {
          donation.items.forEach(item => {
            clothesItems += item.quantity;
            item.quantity = 0;
          });
        }
      }

      try {
        const ImpactStats = require('../models/ImpactStats');
        await ImpactStats.findOneAndUpdate({}, {
          $inc: { 
            totalDonationsCompleted: 1,
            totalFoodSavedKg: weight,
            totalClothesDonated: clothesItems || 1
          }
        }, { upsert: true });
      } catch(e) { console.error('Stat update error:', e); }

      if (!fullyClaimed) {
        donation.status = 'AVAILABLE';
        donation.acceptedReceiver = null;
        donation.handoverVerified = false;
        donation.handoverToken = null;
        donation.handoverTokenExpiry = null;
        donation.handoverFallbackReason = null;
        donation.transferMethod = null;
      } else {
        donation.status = 'COMPLETED';
        donation.completedAt = new Date();
      }
    } else {
      donation.status = 'COMPLETED';
      donation.completedAt = new Date();
    }`;

s = s.replace(target, replacement);
fs.writeFileSync('server/controllers/transferController.js', s);

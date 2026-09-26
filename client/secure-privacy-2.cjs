const fs = require('fs');

function secureController(file) {
  let code = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Protect getReceiverRequests
  if (code.includes('res.json(requests);') && code.includes('getReceiverRequests')) {
    const receiverLogic = `
      // PRIVACY: Remove precise location and contact info if request is not accepted
      const secureRequests = requests.map(req => {
        const reqObj = req.toObject ? req.toObject() : req;
        if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.status !== 'READY_FOR_PICKUP' && reqObj.status !== 'HANDOVER_PENDING' && reqObj.status !== 'ARRIVED') {
           if (reqObj.donation) {
             delete reqObj.donation.preciseLocation;
             delete reqObj.donation.contactNumber;
           }
           if (reqObj.donor) {
              delete reqObj.donor.address;
              delete reqObj.donor.phone;
           }
        }
        return reqObj;
      });
      res.json(secureRequests);
    `;
    code = code.replace(/const requests = await \w+Request\.find\(\{ (?:receiver|requester): req\.user\._id \}\)[\s\S]*?\.sort\(\{ createdAt: -1 \}\);\s*res\.json\(requests\);/, match => {
      changed = true;
      return match.replace('res.json(requests);', receiverLogic);
    });
  }

  // Protect getDonorRequests
  if (code.includes('const enrichedRequests = requests.map')) {
    code = code.replace(/return \{\s*\.\.\.\(req\.toObject \? req\.toObject\(\) : req\),\s*matchData\s*\};/, match => {
      changed = true;
      return `const reqObj = req.toObject ? req.toObject() : req;
        if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.status !== 'READY_FOR_PICKUP' && reqObj.status !== 'HANDOVER_PENDING') {
           if (reqObj.receiver) {
             delete reqObj.receiver.address;
             delete reqObj.receiver.phone;
           }
           if (reqObj.requester) {
             delete reqObj.requester.address;
             delete reqObj.requester.phone;
           }
        }
        return {
          ...reqObj,
          matchData
        };`;
    });
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log('Secured API Privacy in', file);
  }
}

secureController('../server/controllers/foodRequestController.js');
secureController('../server/controllers/clothRequestController.js');

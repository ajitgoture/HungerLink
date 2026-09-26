const fs = require('fs');

function secureController(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Let's modify the getReceiverRequests to map over requests and delete preciseLocation if not ACCEPTED/COMPLETED
  if (code.includes('const requests = await FoodRequest.find({ receiver: req.user._id })') || code.includes('const requests = await ClothRequest.find({ requester: req.user._id })')) {
    
    // For FoodRequest
    const target1 = `const requests = await FoodRequest.find({ receiver: req.user._id })
      .populate('donor', 'name email phone city address')
      .populate('donation')
      .sort({ createdAt: -1 });
    res.json(requests);`;

    const replacement1 = `const requests = await FoodRequest.find({ receiver: req.user._id })
      .populate('donor', 'name email phone city address')
      .populate('donation')
      .sort({ createdAt: -1 });
      
    // PRIVACY: Remove precise location and contact info if request is not accepted
    const secureRequests = requests.map(req => {
      const reqObj = req.toObject ? req.toObject() : req;
      if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.donation) {
         delete reqObj.donation.preciseLocation;
         delete reqObj.donation.contactNumber;
         if (reqObj.donor) {
            delete reqObj.donor.address;
            delete reqObj.donor.phone;
         }
      }
      return reqObj;
    });
    res.json(secureRequests);`;

    if (code.includes(target1)) {
      code = code.replace(target1, replacement1);
      changed = true;
    }

    // For ClothRequest
    const target2 = `const requests = await ClothRequest.find({ requester: req.user._id })
      .populate('donor', 'name email phone city address')
      .populate('donation')
      .sort({ createdAt: -1 });
    res.json(requests);`;

    const replacement2 = `const requests = await ClothRequest.find({ requester: req.user._id })
      .populate('donor', 'name email phone city address')
      .populate('donation')
      .sort({ createdAt: -1 });
      
    // PRIVACY: Remove precise location and contact info if request is not accepted
    const secureRequests = requests.map(req => {
      const reqObj = req.toObject ? req.toObject() : req;
      if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.donation) {
         delete reqObj.donation.preciseLocation;
         delete reqObj.donation.contactNumber;
         if (reqObj.donor) {
            delete reqObj.donor.address;
            delete reqObj.donor.phone;
         }
      }
      return reqObj;
    });
    res.json(secureRequests);`;

    if (code.includes(target2)) {
      code = code.replace(target2, replacement2);
      changed = true;
    }
  }

  // Also protect getDonorRequests - donor should not see receiver's precise address/phone until accepted
  if (code.includes('const enrichedRequests = requests.map(req => {') || code.includes('const enrichedRequests = requests.map((req) => {')) {
     const t1 = `const matchData = calculateMatchScore(req.donation, req);
      return {
        ...(req.toObject ? req.toObject() : req),
        matchData
      };`;
      
     const r1 = `const matchData = calculateMatchScore(req.donation, req);
      const reqObj = req.toObject ? req.toObject() : req;
      if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.receiver) {
         delete reqObj.receiver.address;
         delete reqObj.receiver.phone;
      }
      if (reqObj.status !== 'ACCEPTED' && reqObj.status !== 'COMPLETED' && reqObj.requester) {
         delete reqObj.requester.address;
         delete reqObj.requester.phone;
      }
      return {
        ...reqObj,
        matchData
      };`;
      
      if (code.includes(t1)) {
        code = code.replace(t1, r1);
        changed = true;
      }
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log('Secured API Privacy in', file);
  }
}

secureController('server/controllers/foodRequestController.js');
secureController('server/controllers/clothRequestController.js');

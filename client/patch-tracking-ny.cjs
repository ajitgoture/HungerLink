const fs = require('fs');

function fix(filePath) {
  let c = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (c.includes('typeof donorPos.lat === \'number\'')) {
    c = c.replace(/if \(donorPos && typeof donorPos\.lat === 'number'\) \{ bounds\.extend\(\[donorPos\.lat, donorPos\.lng\]\); hasPts = true; \}/g,
      `if (donorPos && typeof donorPos.lat === 'number' && !(donorPos.lat === 40.7128 && donorPos.lng === -74.006)) { bounds.extend([donorPos.lat, donorPos.lng]); hasPts = true; }`);
    
    c = c.replace(/if \(receiverPos && typeof receiverPos\.lat === 'number'\) \{ bounds\.extend\(\[receiverPos\.lat, receiverPos\.lng\]\); hasPts = true; \}/g,
      `if (receiverPos && typeof receiverPos.lat === 'number' && !(receiverPos.lat === 40.7128 && receiverPos.lng === -74.006)) { bounds.extend([receiverPos.lat, receiverPos.lng]); hasPts = true; }`);
    
    // Fix initialCenter
    c = c.replace(/const initialCenter = donorPos \? \[donorPos\.lat, donorPos\.lng\] : \(receiverPos \? \[receiverPos\.lat, receiverPos\.lng\] : null\);/, 
      `const donorValid = donorPos && !(donorPos.lat === 40.7128 && donorPos.lng === -74.006);
  const receiverValid = receiverPos && !(receiverPos.lat === 40.7128 && receiverPos.lng === -74.006);
  const initialCenter = donorValid ? [donorPos.lat, donorPos.lng] : (receiverValid ? [receiverPos.lat, receiverPos.lng] : null);`);
    
    // Fix rendering markers
    c = c.replace(/\{donorPos && \(/, '{donorValid && (');
    c = c.replace(/\{receiverPos && \(/, '{receiverValid && (');
    c = c.replace(/\{donorPos && receiverPos && \(/, '{donorValid && receiverValid && (');
    
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, c);
    console.log('Fixed TrackingMap placeholder', filePath);
  }
}

fix('src/components/LiveTrackingMap.jsx');
fix('src/components/LiveClothTrackingMap.jsx');

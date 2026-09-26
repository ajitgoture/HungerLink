const fs = require('fs');
let c = fs.readFileSync('src/components/ExploreMap.jsx', 'utf-8');

if (!c.includes('isPlaceholder')) {
  c = c.replace(/if \(typeof lat !== 'number' \|\| typeof lng !== 'number' \|\| isNaN\(lat\) \|\| isNaN\(lng\)\) return;/,
    `if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      
      const isPlaceholder = lat === 40.7128 && lng === -74.006;
      if (isPlaceholder) return; // Do not show dummy New York markers on the explore map`);
  
  fs.writeFileSync('src/components/ExploreMap.jsx', c);
  console.log('Fixed ExploreMap placeholder');
}

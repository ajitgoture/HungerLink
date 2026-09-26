const fs = require('fs');
let files = ['src/components/LiveTrackingMap.jsx', 'src/components/LiveClothTrackingMap.jsx'];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf-8');
  if (!c.includes("import L from 'leaflet'")) {
    c = c.replace(/import \{.*\} from 'react-leaflet';/, match => match + "\\nimport L from 'leaflet';");
  }
  c = c.replace(/window\.L\.latLngBounds/g, 'L.latLngBounds');
  fs.writeFileSync(f, c);
});
console.log("Patched imports");

const fs = require('fs');
const file = 'src/components/ConnectedDetailsModal.jsx';
let c = fs.readFileSync(file, 'utf-8');

const targetUrlLogic = `const lat = donation.preciseLocation?.lat || donation.approximateLocation?.lat;
  const lng = donation.preciseLocation?.lng || donation.approximateLocation?.lng;
  const googleMapsUrl = \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}\`;`;

const newUrlLogic = `const lat = donation.preciseLocation?.lat || donation.approximateLocation?.lat;
  const lng = donation.preciseLocation?.lng || donation.approximateLocation?.lng;
  
  const isPlaceholder = lat === 40.7128 && lng === -74.006;
  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isPlaceholder;
  
  const googleMapsUrl = hasValidCoords 
    ? \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}\`
    : \`https://www.google.com/maps/dir/?api=1&destination=\${encodeURIComponent(address)}\`;`;

if (c.includes('const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;')) {
   c = c.replace(targetUrlLogic, newUrlLogic);
   
   // Also pass a prop to MapView to let it know if it's a placeholder
   c = c.replace(/<MapView lat=\{lat\} lng=\{lng\}/, '<MapView lat={hasValidCoords ? lat : null} lng={hasValidCoords ? lng : null}');
   
   fs.writeFileSync(file, c);
   console.log('Fixed googleMapsUrl in ConnectedDetailsModal');
} else {
   console.log('Target string not found in ConnectedDetailsModal');
}

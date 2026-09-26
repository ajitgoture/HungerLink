const fs = require('fs');

function fixTrackingMap(filePath) {
  let c = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (c.includes('[40.7128, -74.006]')) {
    c = c.replace(/const initialCenter = donorPos \? \[donorPos\.lat, donorPos\.lng\] : \[40\.7128, -74\.006\];/, 
      `const initialCenter = donorPos ? [donorPos.lat, donorPos.lng] : (receiverPos ? [receiverPos.lat, receiverPos.lng] : null);`);
    changed = true;
  }
  
  if (c.includes("'Calculating ETA...'")) {
    c = c.replace(/'Calculating ETA\.\.\.'/g, 't("Calculating ETA...")');
    changed = true;
  }
  
  // Fix MapContainer logic to render fallback if no locations
  if (c.includes('<MapContainer center={initialCenter}')) {
     const replacement = `{initialCenter ? (
          <MapContainer center={initialCenter} zoom={14} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <MapUpdater donorPos={donorPos} receiverPos={receiverPos} />

            {donorPos && (
              <Marker position={[donorPos.lat, donorPos.lng]} icon={donorIcon}>
                <Popup className="font-bold">{isDonorView ? t("You (Donor)") : t("Donor")}</Popup>
              </Marker>
            )}
            
            {receiverPos && (
              <Marker position={[receiverPos.lat, receiverPos.lng]} icon={receiverIcon}>
                <Popup className="font-bold">{!isDonorView ? t("You (Receiver)") : t("Receiver")}</Popup>
              </Marker>
            )}

            {donorPos && receiverPos && (
              <Polyline positions={[[donorPos.lat, donorPos.lng], [receiverPos.lat, receiverPos.lng]]} color="#0d9488" weight={4} dashArray="8, 8" opacity={0.7} />
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
             {t("Waiting for location data...")}
          </div>
        )}`;
        
        // Let's just use string replacement carefully
  }

  // Adding MapUpdater to dynamically fit bounds
  if (!c.includes('MapUpdater')) {
     const mapUpdater = `
// Auto bounds fitter
const MapUpdater = ({ donorPos, receiverPos }) => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
      const bounds = window.L.latLngBounds();
      let hasPts = false;
      if (donorPos && typeof donorPos.lat === 'number') { bounds.extend([donorPos.lat, donorPos.lng]); hasPts = true; }
      if (receiverPos && typeof receiverPos.lat === 'number') { bounds.extend([receiverPos.lat, receiverPos.lng]); hasPts = true; }
      if (hasPts) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }, 200);
    return () => clearTimeout(timeout);
  }, [donorPos, receiverPos, map]);
  return null;
};
`;
     c = c.replace('const LiveTrackingMap =', mapUpdater + '\nconst LiveTrackingMap =');
     
     // Remove RecenterMap
     c = c.replace(/const RecenterMap[\s\S]*?return null;\n};/g, '');
     c = c.replace(/\{isDonorView && donorPos && <RecenterMap[^>]+>\}/g, '');
     c = c.replace(/\{!isDonorView && receiverPos && <RecenterMap[^>]+>\}/g, '');
     
     // Inject MapUpdater
     c = c.replace(/<TileLayer[^>]+>/, match => match + '\n            <MapUpdater donorPos={donorPos} receiverPos={receiverPos} />');
     
     changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, c);
    console.log('Fixed', filePath);
  }
}

fixTrackingMap('src/components/LiveTrackingMap.jsx');
fixTrackingMap('src/components/LiveClothTrackingMap.jsx');

const fs = require('fs');

function repairFile(file) {
  let c = fs.readFileSync(file, 'utf-8');

  // Fix the broken MapContainer block
  // We need to replace everything from `<div className="h-72 w-full rounded-2xl overflow-hidden` to `</MapContainer>\n      </div>`
  
  const badStart = '<div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">';
  const badEnd = '</div>\n\n      {/* Consent Modal Dialog */}';

  if (c.includes(badStart)) {
    const startIndex = c.indexOf(badStart);
    const endIndex = c.indexOf(badEnd, startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const properBlock = `
      <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        {initialCenter ? (
          <MapContainer center={initialCenter} zoom={14} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <MapUpdater donorPos={donorPos} receiverPos={receiverPos} />

            {/* Donor Position Marker */}
            {donorValid && donorPos && (
              <Marker position={[donorPos.lat, donorPos.lng]} icon={carIcon || userPinIcon}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-extrabold text-xs text-slate-900">{t("Donor Location")}</p>
                    <p className="text-[10px] text-slate-500">{isDonorView ? 'You (Donor)' : 'Connected Donor'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Receiver Position Marker */}
            {receiverValid && receiverPos && (
              <Marker position={[receiverPos.lat, receiverPos.lng]} icon={userPinIcon}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-extrabold text-xs text-slate-900">{t("Receiver Location")}</p>
                    <p className="text-[10px] text-slate-500">{!isDonorView ? 'You (Receiver)' : 'Connected Receiver'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Line showing route/connection */}
            {donorValid && donorPos && receiverValid && receiverPos && (
              <Polyline positions={[[donorPos.lat, donorPos.lng], [receiverPos.lat, receiverPos.lng]]} color="#0d9488" weight={4} dashArray="8, 8" />
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-slate-500 text-sm">{t("Waiting for location data...")}</p>
             <p className="text-xs text-slate-400 mt-1">{t("Live map will appear once GPS is shared.")}</p>
          </div>
        )}
      </div>\n\n      {/* Consent Modal Dialog */}`;
      
      const toReplace = c.substring(startIndex, endIndex + badEnd.length);
      c = c.replace(toReplace, properBlock);
      
      fs.writeFileSync(file, c);
      console.log('Repaired map block in', file);
    }
  }
}

repairFile('src/components/LiveTrackingMap.jsx');
repairFile('src/components/LiveClothTrackingMap.jsx');

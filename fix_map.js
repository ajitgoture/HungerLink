const fs = require('fs');
let s = fs.readFileSync('client/src/components/LiveTrackingMap.jsx', 'utf8');

s = s.replace(/href=\{https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=,\}/g, "href={`https://www.google.com/maps/dir/?api=1&destination=${isDonorView ? (receiverPos ? receiverPos[1] + ',' + receiverPos[0] : '') : (donorPos ? donorPos[1] + ',' + donorPos[0] : '')}`}");
s = s.replace(/target=_blank\\n                rel=\n  oopener" "noreferrer\\n                className=px-4" py-2\.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 "cursor-pointer\\n              >/g, 'target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">');
s = s.replace(/<Navigation className=w-4" h-4 "fill-white \/> \{t\(Navigate\)\}/g, '<Navigation className="w-4 h-4 fill-white" /> {t("Navigate")}');

fs.writeFileSync('client/src/components/LiveTrackingMap.jsx', s);

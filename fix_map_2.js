const fs = require('fs');
let s = fs.readFileSync('client/src/components/LiveTrackingMap.jsx', 'utf8');

const regex = /target=_blank\\n\s+rel=[\s\S]+?cursor-pointer\\n\s+>/;
s = s.replace(regex, 'target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">');

fs.writeFileSync('client/src/components/LiveTrackingMap.jsx', s);
console.log("Done");

const fs = require('fs');
let c = fs.readFileSync('src/pages/cloth/ClothReceiverDashboard.jsx', 'utf8');

c = c.replace(/<h4 className="text-base font-black text-slate-900 mt-0\.5">[\s\n]*\{req\.donation\?\.items &&/g, '<h4 className="text-base font-black text-slate-900 mt-0.5">\n{req.donation?.items &&');

c = c.replace(/<\/span>\s*<\/>\s*\)}/g, '</span>\n                        </>\n                      )}</h4>');

fs.writeFileSync('src/pages/cloth/ClothReceiverDashboard.jsx', c);

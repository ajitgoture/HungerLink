const fs = require('fs');

// Patch DonationCard.jsx
let file = 'src/components/DonationCard.jsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/metric: \`Total: \$\{totalPieces\} pieces\`,/, 'metric: `Total Pieces: ${totalPieces}`,');
c = c.replace(/\? \{t\(it\.recipientCategory\)\} - \{it\.type\} - \{it\.size\} - \{it\.quantity\} \{t\("pieces"\)\}/, '• {t(it.recipientCategory)} — {t(it.type)} — {it.size} — {it.quantity} {t("pieces")}');
fs.writeFileSync(file, c);

// Patch ClothDonorDashboard.jsx
file = 'src/pages/cloth/ClothDonorDashboard.jsx';
c = fs.readFileSync(file, 'utf8');
c = c.replace(/<h4 className="text-base font-black text-slate-900">\{donation\.items\.length\} \{t\("Items Donation"\)\}<\/h4>\s*<p className="text-xs text-slate-500 mt-0\.5">\s*\{t\("Total Qty:"\)\} \{donation\.items\.reduce\(\(acc, it\) => acc \+ \(parseInt\(it\.quantity\)\|\|1\), 0\)\}\s*<\/p>/g,
`<h4 className="text-base font-black text-slate-900">{t("Clothing Donation")}</h4>
<p className="text-xs text-slate-500 mt-0.5">
  {donation.items.length} {t("Items")} <br/> {donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)} {t("Total Pieces")}
</p>`);
fs.writeFileSync(file, c);

// Patch ClothReceiverDashboard.jsx
file = 'src/pages/cloth/ClothReceiverDashboard.jsx';
c = fs.readFileSync(file, 'utf8');
c = c.replace(/\{req\.donation\.items\.length\} \{t\('Items Donation'\)\}\s*<span className='text-xs text-slate-500 block mt-0\.5'>\s*\{t\('Total Qty:'\)\} \{req\.donation\.items\.reduce\(\(acc, it\) => acc \+ \(parseInt\(it\.quantity\)\|\|1\), 0\)\}\s*<\/span>/g,
`{t("Clothing Donation")}
<span className='text-xs text-slate-500 block mt-0.5'>
  {req.donation.items.length} {t("Items")} • {req.donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)} {t("Total Pieces")}
</span>`);
fs.writeFileSync(file, c);

// Patch MyClothDonations.jsx
file = 'src/pages/cloth/MyClothDonations.jsx';
if (fs.existsSync(file)) {
  c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\{donation\.items\.length\} \{t\("Items Donation"\)\}\s*<span className="block mt-0\.5 opacity-75">\{t\("Total Qty:"\)\} \{donation\.items\.reduce\(\(acc, it\) => acc \+ \(parseInt\(it\.quantity\)\|\|1\), 0\)\}<\/span>/g,
  `{t("Clothing Donation")}
<span className="block mt-0.5 opacity-75">{donation.items.length} {t("Items")} • {donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)} {t("Total Pieces")}</span>`);
  fs.writeFileSync(file, c);
}

const fs = require('fs');
const files = [
  'src/pages/cloth/MyClothDonations.jsx',
  'src/pages/cloth/MyClothRequests.jsx',
  'src/pages/cloth/ClothRequestsReceived.jsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    const regex = /<h3 className="text-xl font-black text-slate-900 mt-1">\{.*?clothingType\}<\/h3>[\s\S]*?<\/p>/g;
    const replacement = `<h3 className="text-xl font-black text-slate-900 mt-1">
                          {donation.items && donation.items.length > 0 ? \`\${donation.items.length} \${t('Items Donation')}\` : donation.clothingType}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {donation.items && donation.items.length > 0 
                            ? \`\${t('Total Qty:')} \${donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)}\`
                            : \`\${donation.quantity} \${t('items')} • \${t('Size')} \${donation.size} • \${donation.condition} \${t('Condition')}\`
                          }
                        </p>`;
    c = c.replace(regex, replacement);
    fs.writeFileSync(file, c);
  }
}

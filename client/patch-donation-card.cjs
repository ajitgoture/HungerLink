const fs = require('fs');
let c = fs.readFileSync('src/components/DonationCard.jsx', 'utf8');

const themeReplacement = `
  const totalPieces = !isFood && item.items ? item.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0) : item.quantity;
  const theme = isFood ? {
    color: 'amber',
    icon: <Users className="w-4 h-4 mr-1.5" />,
    metric: \`\${item.peopleServed} Served\`,
    typeLabel: item.foodType,
    bgImgFallback: 'bg-amber-100'
  } : {
    color: 'indigo',
    icon: <Box className="w-4 h-4 mr-1.5" />,
    metric: \`Total: \${totalPieces} pieces\`,
    typeLabel: item.clothingType || 'Clothes',
    bgImgFallback: 'bg-indigo-100'
  };`;

c = c.replace(/const theme = isFood \? \{[\s\S]*?bgImgFallback: 'bg-indigo-100'\s*\};/, themeReplacement);

const titleReplacement = `{isFood ? item.foodName : t("Clothing Donation")}`;
c = c.replace(/\{isFood \? item\.foodName : item\.title \|\| item\.clothType\}/, titleReplacement);

const clothSummaryHTML = `
          {!isFood && item.items && item.items.length > 0 && (
            <div className="mb-4 text-xs text-slate-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
              <p className="font-semibold text-indigo-900 mb-1">{t("Available Items:")}</p>
              <ul className="space-y-1">
                {item.items.slice(0, 3).map((it, idx) => (
                  <li key={idx} className="truncate">• {t(it.recipientCategory)} — {it.type} — {it.size} — {it.quantity} {t("pieces")}</li>
                ))}
                {item.items.length > 3 && (
                  <li className="text-indigo-500 font-medium pl-2">+{item.items.length - 3} {t("more items...")}</li>
                )}
              </ul>
            </div>
          )}
          {isFood && (
            <div className="grid grid-cols-2 gap-3 mb-4">
`;

// Replace the `<div className="grid grid-cols-2 gap-3 mb-4">` section carefully. We only want to inject the cloth summary before the grid.
c = c.replace(/<div className="grid grid-cols-2 gap-3 mb-4">/, clothSummaryHTML);
// Since I just added {isFood && (, I need to close it after the grid. The grid ends right before `{item.donor?.name &&`.
c = c.replace(/<\/div>\s*\{item\.donor\?\.name/, '</div>\n          }\n          {item.donor?.name');

// In the top image section, change `item.imageUrl` to handle array of images
c = c.replace(/item\.imageUrl \? <img src=\{item\.imageUrl\}/g, '(item.imageUrl || (item.imageUrls && item.imageUrls[0])) ? <img src={item.imageUrl || item.imageUrls[0]}');

fs.writeFileSync('src/components/DonationCard.jsx', c);

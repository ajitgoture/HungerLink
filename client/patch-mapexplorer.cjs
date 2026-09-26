const fs = require('fs');
let c = fs.readFileSync('src/pages/cloth/ClothMapExplorer.jsx', 'utf8');
const regex = /<h4 className="font-black text-sm text-slate-900">\{donation\.clothingType\}<\/h4>[\s\S]*?<\/p>/;
const replacement = `{donation.items && donation.items.length > 0 ? (
  <>
    <h4 className='font-black text-sm text-slate-900'>{donation.items.length} {t('Items Donation')}</h4>
    <p className='text-[11px] text-slate-600'>{t('Total Qty:')} {donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)}</p>
  </>
) : (
  <>
    <h4 className='font-black text-sm text-slate-900'>{donation.clothingType}</h4>
    <p className='text-[11px] text-slate-600'>{t('Qty:')} {donation.quantity} • {t('Size:')} {donation.size} • {t('Condition:')} {donation.condition}</p>
  </>
)}`;
c = c.replace(regex, replacement);
fs.writeFileSync('src/pages/cloth/ClothMapExplorer.jsx', c);

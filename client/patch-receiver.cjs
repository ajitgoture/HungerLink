const fs = require('fs');
let c = fs.readFileSync('src/pages/cloth/ClothReceiverDashboard.jsx', 'utf8');

const regex = /\{req\.donation\?\.clothingType\} \(\{req\.donation\?\.clothingCategory\}\)[\s\S]*?<\/p>/;
const replacement = `{req.donation?.items && req.donation.items.length > 0 ? (
                        <>
                          {req.donation.items.length} {t('Items Donation')}
                          <span className='text-xs text-slate-500 block mt-0.5'>
                            {t('Total Qty:')} {req.donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)}
                          </span>
                        </>
                      ) : (
                        <>
                          {req.donation?.clothingType} ({req.donation?.clothingCategory})
                          <span className='text-xs text-slate-500 block mt-0.5'>
                            {t('Qty:')} {req.donation?.quantity} • {t('Size:')} {req.donation?.size}
                          </span>
                        </>
                      )}`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/pages/cloth/ClothReceiverDashboard.jsx', c);

const fs = require('fs');
let c = fs.readFileSync('src/pages/cloth/ClothDonorDashboard.jsx', 'utf8');

const regex = /<h4 className="text-base font-black text-slate-900">\{donation\.clothingType\}<\/h4>[\s\S]*?<\/p>/;

const replacement = `{donation.items && donation.items.length > 0 ? (
                      <>
                        <h4 className="text-base font-black text-slate-900">{donation.items.length} {t("Items Donation")}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t("Total Qty:")} {donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)}
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="text-base font-black text-slate-900">{donation.clothingType}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t("Qty:")} {donation.quantity} • {t("Condition:")} {donation.condition}
                        </p>
                      </>
                    )}`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/pages/cloth/ClothDonorDashboard.jsx', c);

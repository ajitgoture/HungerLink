const fs = require('fs');

let detailFile = 'src/pages/DonationDetail.jsx';
let c = fs.readFileSync(detailFile, 'utf8');

const regex = /<h4 className="text-sm font-bold text-slate-900">\{t\("Clothing Details"\)\}<\/h4>[\s\S]*?(?=\{donation\.description)/;

const replacement = `<div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{t("Clothing Items")}</h4>
                        {donation.items && donation.items.length > 0 && (
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                            {t("Total Pieces:")} {donation.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
                          </span>
                        )}
                      </div>
                      
                      {donation.items && donation.items.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {donation.items.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-lg border bg-indigo-50/50 border-indigo-100 flex flex-col justify-center">
                                <p className="font-semibold text-indigo-900">
                                  {t(item.recipientCategory)} — {t(item.type)} — {item.size} — {item.quantity} {t("pieces")}
                                </p>
                                <p className="text-xs text-indigo-700 mt-1 flex gap-3">
                                  <span>{t("Condition:")} <b>{t(item.condition)}</b></span>
                                  {item.season && <span>{t("Season:")} <b>{t(item.season)}</b></span>}
                                </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Fallback for completely unmapped old single-item without items array */}
                          <div>
                            <p className="text-xs text-slate-500">{t("Category & Type")}</p>
                            <p className="font-bold text-slate-700">{donation.clothingCategory} - {donation.clothingType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">{t("Size & Condition")}</p>
                            <p className="font-bold text-slate-700">{donation.size} / {donation.condition}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  `;

c = c.replace(regex, replacement);
fs.writeFileSync(detailFile, c);

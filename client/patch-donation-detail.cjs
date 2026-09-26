const fs = require('fs');

const file = 'src/pages/DonationDetail.jsx';
let c = fs.readFileSync(file, 'utf8');

const replacement = `{!isFood && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">{t("Clothing Details")}</h4>
                    
                    {donation.items && donation.items.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {donation.items.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg border bg-indigo-50/50 border-indigo-100 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-indigo-900">
                                {t(item.recipientCategory)} - {t(item.type)} 
                                <span className="font-normal text-xs ml-1 opacity-75">({item.quantity} {t("pieces")})</span>
                              </p>
                              <p className="text-xs text-indigo-700 mt-1 flex gap-3">
                                <span>{t("Size:")} <b>{item.size}</b></span>
                                <span>{t("Condition:")} <b>{t(item.condition)}</b></span>
                                {item.season && <span>{t("Season:")} <b>{t(item.season)}</b></span>}
                              </p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 shadow-none hover:bg-indigo-100">{t("Available")}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {donation.gender && <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500">{t("Gender:")} </span>
                            <span className="text-slate-800">{donation.gender}</span>
                          </div>}
                        {donation.ageGroup && <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500">{t("Age Group:")} </span>
                            <span className="text-slate-800">{donation.ageGroup}</span>
                          </div>}
                        {donation.season && <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500">{t("Season:")} </span>
                            <span className="text-slate-800">{donation.season}</span>
                          </div>}
                      </div>
                    )}
                  </div>
                )}
`;

c = c.replace(/\{!isFood && <div className="space-y-3 pt-4 border-t border-slate-100">[\s\S]*?<\/div>\}[\s\n]*\{donation\.description &&/, replacement + '\n\n                {donation.description &&');

fs.writeFileSync(file, c);

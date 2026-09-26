const fs = require('fs');
let s = fs.readFileSync('client/src/pages/DonationDetail.jsx', 'utf8');

// For Food quantity selector
const targetFood = `{isFood && <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t("Serves")}</p>
                      <p className="text-lg font-black text-slate-900">~{donation.peopleServed} {t("People")}</p>
                    </div>}`;
                    
const replacementFood = `{isFood && <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t("Serves")}</p>
                      <p className="text-lg font-black text-slate-900">~{donation.peopleServed} {t("People")}</p>
                    </div>}
                  {isFood && isAvailable && !isAlreadyRequested && !user.role.includes('Donor') && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 col-span-2">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">{t("Request Quantity")}</p>
                      <div className="flex items-center gap-3">
                        <input type="number" min="1" max={donation.quantity} value={requestedQty} onChange={e => setRequestedQty(Math.min(Math.max(1, parseInt(e.target.value)||1), donation.quantity))} className="w-24 p-2 border border-emerald-200 rounded-lg text-center font-bold text-emerald-900" />
                        <span className="text-sm text-emerald-700">{donation.unit} ({t("Max:")} {donation.quantity})</span>
                      </div>
                    </div>
                  )}`;
                  
s = s.replace(targetFood, replacementFood);

// For Cloth quantity selector
const startCloth = s.indexOf('{donation.items.map((item, idx) => (');
const endCloth = s.indexOf('))}</div>', startCloth);
const targetCloth = s.substring(startCloth, endCloth + '))}</div>'.length);

const replacementCloth = `{donation.items.map((item, idx) => (
                              <div key={idx} className="p-3 rounded-lg border bg-indigo-50/50 border-indigo-100 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-indigo-900">
                                      {t(item.recipientCategory)} — {t(item.type)} — {item.size} — {item.quantity} {t("pieces")}
                                    </p>
                                    <p className="text-xs text-indigo-700 mt-1 flex gap-3">
                                      <span>{t("Condition:")} <b>{t(item.condition)}</b></span>
                                      {item.season && <span>{t("Season:")} <b>{t(item.season)}</b></span>}
                                    </p>
                                  </div>
                                  {!user.role.includes('Donor') && isAvailable && !isAlreadyRequested && (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="0" 
                                        max={item.quantity} 
                                        value={requestedClothItems[item._id || idx] ?? 0} 
                                        onChange={e => setRequestedClothItems(prev => ({...prev, [item._id || idx]: Math.min(Math.max(0, parseInt(e.target.value)||0), item.quantity)}))} 
                                        className="w-16 p-1.5 text-sm border border-indigo-200 rounded text-center font-bold text-indigo-900" 
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>`;
                          
s = s.replace(targetCloth, replacementCloth);
fs.writeFileSync('client/src/pages/DonationDetail.jsx', s);

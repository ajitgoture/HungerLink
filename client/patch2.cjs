const fs = require('fs'); 
let content = fs.readFileSync('src/components/TransferTimeline.jsx', 'utf-8'); 

content = content.replace(
  '<div className="text-center space-y-2">\n                    <p className="text-sm text-emerald-700">{t("Show this code to the receiver")}</p>\n                    <div className="text-4xl font-black text-slate-900 tracking-[0.2em] py-4 bg-white rounded-xl border border-emerald-200 shadow-inner">\n                      {tokenInfo.token}\n                    </div>\n                    <p className="text-xs text-emerald-600">\n                      {t("Expires in 15 minutes. DO NOT share this online.")}\n                    </p>\n                  </div>',
  `<div className="flex flex-col items-center space-y-4 pt-2">
                    <p className="text-sm text-emerald-700 font-medium text-center">{t("Show this QR code to the receiver")}</p>
                    <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm inline-block">
                      <QRCodeSVG value={JSON.stringify({ donationId: donation._id, token: tokenInfo.token })} size={180} level="H" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-widest text-center bg-white px-8 py-2 rounded-xl border border-emerald-100 shadow-inner">
                      {tokenInfo.token}
                    </div>
                    <p className="text-xs text-emerald-600 text-center font-medium">
                      {t("Expires in 15 minutes. DO NOT share this online.")}
                    </p>
                  </div>`
);

content = content.replace(
  '{t("The receiver must enter this code to complete the donation.")}',
  '{t("The receiver must scan this QR code or enter the 6-digit PIN to complete the donation.")}'
);

const receiverOld = `{!fallbackMode ? <div className="space-y-3">
                    <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder={t("Enter 6-digit code from Donor")} className="w-full p-3 text-center text-xl font-bold tracking-widest bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                    <Button onClick={handleVerifyToken} disabled={tokenInput.length !== 6} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-4 h-4 mr-2" /> {t("Confirm Receipt")}
                    </Button>
                    <button onClick={() => setFallbackMode(true)} className="w-full text-xs text-emerald-700 font-semibold underline py-2">
                      {t("QR/Code scanning not working?")}
                    </button>
                  </div>`;

const receiverNew = `{showScanner ? (
                  <QRScanner 
                    onScan={(data) => {
                      try {
                        const parsed = JSON.parse(data);
                        if (parsed.token) {
                          setTokenInput(parsed.token);
                          setShowScanner(false);
                        }
                      } catch(e) {
                        setTokenInput(data.replace(/[^0-9]/g, '').slice(0, 6)); 
                        setShowScanner(false);
                      }
                    }} 
                    onClose={() => setShowScanner(false)} 
                  />
                ) : !fallbackMode ? <div className="space-y-3">
                    <Button onClick={() => setShowScanner(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 mb-2 py-6 text-base shadow-md">
                      <QrCode className="w-5 h-5 mr-2" /> {t("Scan QR Code")}
                    </Button>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-emerald-200"></div>
                      <span className="flex-shrink-0 mx-4 text-emerald-600 text-xs font-semibold uppercase">{t("Or Enter Code Manually")}</span>
                      <div className="flex-grow border-t border-emerald-200"></div>
                    </div>
                    <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder={t("Enter 6-digit code from Donor")} className="w-full p-3 text-center text-xl font-bold tracking-widest bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
                    <Button onClick={handleVerifyToken} disabled={tokenInput.length !== 6} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                      <Check className="w-4 h-4 mr-2" /> {t("Confirm Receipt")}
                    </Button>
                    <button onClick={() => setFallbackMode(true)} className="w-full text-xs text-emerald-700 font-semibold underline py-2 mt-2">
                      {t("Scanning / PIN not working?")}
                    </button>
                  </div>`;

content = content.replace(receiverOld, receiverNew);
fs.writeFileSync('src/components/TransferTimeline.jsx', content);

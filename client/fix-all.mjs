import fs from 'fs';

let content = fs.readFileSync('src/components/TransferTimeline.jsx', 'utf-8');

const regex = /\{status === 'HANDOVER_PENDING' && isDonor && <div className="space-y-4">[\s\S]*?\{\/\* Generic Cancel Button/;

const newBlocks = `{status === 'HANDOVER_PENDING' && isDonor && <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                <ShieldCheck className="w-5 h-5" /> {t("Secure Handover Code")}
              </div>
              
              {!tokenInfo ? <Button onClick={handleGenerateToken} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <QrCode className="w-4 h-4 mr-2" /> {t("Generate Verification Code")}
                </Button> : <div className="flex flex-col items-center space-y-4 pt-2">
                  <p className="text-sm text-emerald-700 font-medium text-center">{t("Show this QR code to the receiver")}</p>
                  <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm inline-block">
                    <QRCodeSVG value={tokenInfo.qrPayload || JSON.stringify({ donationId: donation._id, token: tokenInfo.token, purpose: 'HungerLink_Handover_Verification' })} size={180} level="H" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-widest text-center bg-white px-8 py-2 rounded-xl border border-emerald-100 shadow-inner">
                    {tokenInfo.token}
                  </div>
                  <p className="text-xs text-emerald-600 text-center font-medium">
                    {t("Expires in 15 minutes. DO NOT share this online.")}
                  </p>
                </div>}
            </div>
            <p className="text-xs text-slate-500 text-center px-4">
              {t("The receiver must scan this QR code or enter the 6-digit PIN to complete the donation.")}
            </p>
          </div>}

        {status === 'HANDOVER_PENDING' && isReceiver && <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-between gap-2 text-emerald-800 font-bold mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> {t("Verify Handover")}
                </div>
              </div>
              
              {showScanner ? (
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
                  <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder={t("Enter 6-digit PIN from Donor")} className="w-full p-3 text-center text-xl font-bold tracking-widest bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow" />
                  <Button onClick={handleVerifyToken} disabled={tokenInput.length !== 6} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                    <Check className="w-4 h-4 mr-2" /> {t("Confirm Receipt")}
                  </Button>
                  <button onClick={() => setFallbackMode(true)} className="w-full text-xs text-emerald-700 font-semibold underline py-2 mt-2">
                    {t("Scanning / PIN not working?")}
                  </button>
                </div> : <div className="space-y-3">
                  <p className="text-sm text-amber-700 font-semibold mb-2">{t("Fallback Manual Confirmation")}</p>
                  <input type="text" value={fallbackReason} onChange={e => setFallbackReason(e.target.value)} placeholder={t("Reason for manual confirmation (e.g. Phone battery died)")} className="w-full p-3 text-sm bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <div className="flex gap-2">
                    <Button onClick={() => setFallbackMode(false)} variant="outline" className="flex-1 bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      {t("Cancel")}
                    </Button>
                    <Button onClick={handleFallbackComplete} disabled={!fallbackReason.trim()} className="flex-1 bg-amber-600 hover:bg-amber-700">
                      {t("Complete Anyway")}
                    </Button>
                  </div>
                </div>}
            </div>
          </div>}

        {/* Generic Cancel Button`;

content = content.replace(regex, newBlocks);

fs.writeFileSync('src/components/TransferTimeline.jsx', content);
console.log("Patched successfully");

import fs from 'fs';

let content = fs.readFileSync('src/components/TransferTimeline.jsx', 'utf-8');

const regexDonor = /\{status === 'HANDOVER_PENDING' && isDonor && <div className="space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*\}/;

const newDonorBlock = `{status === 'HANDOVER_PENDING' && isDonor && <div className="space-y-4">
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
          </div>}`;

content = content.replace(regexDonor, newDonorBlock);

fs.writeFileSync('src/components/TransferTimeline.jsx', content);
console.log("Patched Donor successfully");

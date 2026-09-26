const fs = require('fs');
let lines = fs.readFileSync('client/src/pages/DonationDetail.jsx', 'utf8').split(/\r?\n/);
let out = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("showToast(t('toastTitle_error'") && lines[i+1].includes("navigate(`/")) {
    out.push('        setError(err.response?.status === 404 ? t("Donation not found") : t("toastMsg_failedToLoadDonationDetails"));');
    i++; // skip navigate line
  } else if (lines[i].includes('if (loading) {') && !lines.slice(Math.max(0, i-10), i).some(l => l.includes('if (error)'))) {
    out.push(`    if (error) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-100">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
            <Button className="mt-4 w-full" onClick={() => navigate(\`/\${type}/available\`)}>
              {t("Go Back")}
            </Button>
          </div>
        </div>
      );
    }
    
    if (loading) {`);
  } else {
    out.push(lines[i]);
  }
}
fs.writeFileSync('client/src/pages/DonationDetail.jsx', out.join('\n'));

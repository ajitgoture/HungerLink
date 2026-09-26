const fs = require('fs');

let content = fs.readFileSync('src/pages/DonationDetail.jsx', 'utf8');

const targetCatch = `      } catch (err) {
        showToast(t('toastTitle_error'), t('toastMsg_failedToLoadDonationDetails'));
        navigate(\`/\${type}\`);
      } finally {`;

const newCatch = `      } catch (err) {
        setError(err.response?.status === 404 ? t("Donation not found") : t("toastMsg_failedToLoadDonationDetails"));
      } finally {`;

content = content.replace(targetCatch, newCatch);

const targetRender = `if (loading) {`;
const newRender = `if (error) {
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
    
    if (loading) {`;

content = content.replace(targetRender, newRender);

fs.writeFileSync('src/pages/DonationDetail.jsx', content);

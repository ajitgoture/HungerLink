const fs = require('fs');

let content = fs.readFileSync('client/src/pages/DonationDetail.jsx', 'utf8');

// 1. Add error state to DonationDetail
content = content.replace(
  `const [hasReviewed, setHasReviewed] = useState(false);`,
  `const [hasReviewed, setHasReviewed] = useState(false);\n  const [error, setError] = useState(null);`
);

// 2. Change catch block
content = content.replace(
  `      } catch (err) {
        showToast(t('toastTitle_error'), t('toastMsg_failedToLoadDonationDetails'));
        navigate(\`/\${type}\`);
      }`,
  `      } catch (err) {
        setError(err.response?.status === 404 ? t("Donation not found") : t("toastMsg_failedToLoadDonationDetails"));
      }`
);

// 3. Render error state early
content = content.replace(
  `if (loading) {`,
  `if (error) {
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
    
    if (loading) {`
);

fs.writeFileSync('client/src/pages/DonationDetail.jsx', content);
console.log('Patched DonationDetail.jsx');

const fs = require('fs');
let s = fs.readFileSync('client/src/components/ReviewForm.jsx', 'utf8');

s = s.replace(`export const ReviewForm = ({
  donation,
  onReviewComplete,
  onReport
}) => {`, `export const ReviewForm = ({
  donation,
  isDonor,
  onReviewComplete,
  onReport
}) => {`);

s = s.replace(`<h3 className="text-xl font-black text-slate-900 mb-2 text-center">{t("Rate your experience")}</h3>`, `<h3 className="text-xl font-black text-slate-900 mb-2 text-center">{isDonor ? t("Rate Receiver") : t("Rate Donor")}</h3>`);

fs.writeFileSync('client/src/components/ReviewForm.jsx', s);

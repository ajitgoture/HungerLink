const fs = require('fs');
let s = fs.readFileSync('client/src/pages/DonationDetail.jsx', 'utf8');

// 1. Replace the checkReview useEffect
const oldEffect = `  useEffect(() => {
    if (!donation || !user || donation.status !== 'COMPLETED') return;
    const checkReview = async () => {
      try {
        const res = await api.get(\`/reviews/status/\${donation._id}\`);
        setHasReviewed(res.data.hasReviewed);
      } catch(e) {}
    };
    checkReview();
  }, [donation, user]);`;

const newEffect = `  const [pendingReviewObj, setPendingReviewObj] = useState(null);

  useEffect(() => {
    if (!donation || !user) return;
    const checkPending = async () => {
      try {
        const res = await api.get('/reviews/pending');
        const pending = res.data.find(r => r._id === donation._id || r.id === donation._id);
        if (pending) {
          setPendingReviewObj(pending);
          setHasReviewed(false);
        } else {
          setPendingReviewObj(null);
          setHasReviewed(true);
        }
      } catch(e) {}
    };
    checkPending();
  }, [donation, user, hasReviewed]);`;

s = s.replace(oldEffect, newEffect);

// 2. Replace the render logic for the ReviewForm
const oldRender = `{donation?.status === 'COMPLETED' && user && !hasReviewed && (donation.donor?._id === user._id || donation.donor === user._id || donation.acceptedReceiver?._id === user._id || donation.acceptedReceiver === user._id) && <ReviewForm donation={donation} isDonor={donation.donor?._id === user._id || donation.donor === user._id} onReviewComplete={() => setHasReviewed(true)} onReport={() => setShowReportModal(true)} />}`;

const newRender = `{pendingReviewObj && user && !hasReviewed && <ReviewForm donation={pendingReviewObj} isDonor={pendingReviewObj.donor?._id === user._id || pendingReviewObj.donor === user._id} onReviewComplete={() => { setHasReviewed(true); setPendingReviewObj(null); }} onReport={() => setShowReportModal(true)} />}`;

s = s.replace(oldRender, newRender);

fs.writeFileSync('client/src/pages/DonationDetail.jsx', s);
console.log('Fixed DonationDetail.jsx');

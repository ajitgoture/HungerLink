const fs = require('fs');
let s = fs.readFileSync('client/src/pages/food/MyRequests.jsx', 'utf8');

// 1. Import RateModal
s = s.replace(`import LiveTrackingMap from '../../components/LiveTrackingMap';`, `import LiveTrackingMap from '../../components/LiveTrackingMap';\nimport { RateModal } from '../../components/RateModal';`);

// 2. Add state
const oldState = `  const [confirmingId, setConfirmingId] = useState(null);\n  const [successMessage, setSuccessMessage] = useState('');`;
const newState = `  const [confirmingId, setConfirmingId] = useState(null);\n  const [successMessage, setSuccessMessage] = useState('');\n  const [pendingReviews, setPendingReviews] = useState([]);\n  const [rateModalData, setRateModalData] = useState(null);`;
s = s.replace(oldState, newState);

// 3. Fetch pending reviews
const oldFetch = `      const {
        data
      } = await api.get('/food/requests/receiver');
      setRequests(data || []);`;
const newFetch = `      const { data } = await api.get('/food/requests/receiver');
      setRequests(data || []);
      try {
        const revRes = await api.get('/reviews/pending');
        setPendingReviews(revRes.data || []);
      } catch (e) {}`;
s = s.replace(oldFetch, newFetch);

// 4. Add Rate button and modal
const oldAction = `{canConfirmReceived && <button onClick={() => handleConfirmReceived(req)} disabled={confirmingId === req._id} className="flex-1 sm:flex-none py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                          <CheckCircle2 className="w-4 h-4" /> {confirmingId === req._id ? t("Confirming...") : t("Confirm Food Received")}
                        </button>}`;

const newAction = `{canConfirmReceived && <button onClick={() => handleConfirmReceived(req)} disabled={confirmingId === req._id} className="flex-1 sm:flex-none py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                          <CheckCircle2 className="w-4 h-4" /> {confirmingId === req._id ? t("Confirming...") : t("Confirm Food Received")}
                        </button>}
                        
                        {req.status === 'COMPLETED' && pendingReviews.find(r => r.requestId === req._id) && (
                          <button onClick={() => setRateModalData({...pendingReviews.find(r => r.requestId === req._id), isCurrentUserDonor: false})} className="flex-1 sm:flex-none py-3 px-5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-xs border border-amber-200 transition flex items-center justify-center gap-2 cursor-pointer">
                            <Heart className="w-4 h-4" /> {t("Rate Donor")}
                          </button>
                        )}`;
s = s.replace(oldAction, newAction);

// 5. Render Modal at the end
s = s.replace(`      <ConnectedDetailsModal isOpen={!!activeModalRequest} onClose={() => setActiveModalRequest(null)} request={activeModalRequest} />\n    </div>`, `      <ConnectedDetailsModal isOpen={!!activeModalRequest} onClose={() => setActiveModalRequest(null)} request={activeModalRequest} />\n      <RateModal isOpen={!!rateModalData} donation={rateModalData} onClose={() => setRateModalData(null)} onReviewComplete={() => { setRateModalData(null); fetchMyRequests(); }} />\n    </div>`);

fs.writeFileSync('client/src/pages/food/MyRequests.jsx', s);
console.log('Fixed MyRequests');

const fs = require('fs');
let s = fs.readFileSync('client/src/pages/cloth/MyClothDonations.jsx', 'utf8');

// 1. Import RateModal
s = s.replace(`import LiveTrackingMap from '../../components/LiveTrackingMap';`, `import LiveTrackingMap from '../../components/LiveTrackingMap';\nimport { RateModal } from '../../components/RateModal';`);

// 2. Add state
const oldState = `  const [updatingId, setUpdatingId] = useState(null);\n  const {\n    showToast\n  } = useNotifications();`;
const newState = `  const [updatingId, setUpdatingId] = useState(null);\n  const { showToast } = useNotifications();\n  const [pendingReviews, setPendingReviews] = useState([]);\n  const [rateModalData, setRateModalData] = useState(null);`;
s = s.replace(oldState, newState);

// 3. Fetch pending reviews
const oldFetch = `      const {
        data
      } = await api.get('/cloth/donations/my-donations');
      setDonations(data || []);`;
const newFetch = `      const { data } = await api.get('/cloth/donations/my-donations');
      setDonations(data || []);
      try {
        const revRes = await api.get('/reviews/pending');
        setPendingReviews(revRes.data || []);
      } catch (e) {}`;
s = s.replace(oldFetch, newFetch);

// 4. Add Rate button and modal
const oldAction = `{donation.status === 'AVAILABLE' && <button onClick={() => handleDelete(donation._id)} disabled={updatingId === donation._id} className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 shadow-sm transition disabled:opacity-50 cursor-pointer">
                        {updatingId === donation._id ? t("Deleting...") : t("Delete")}
                      </button>}`;

const newAction = `{donation.status === 'AVAILABLE' && <button onClick={() => handleDelete(donation._id)} disabled={updatingId === donation._id} className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 shadow-sm transition disabled:opacity-50 cursor-pointer">
                        {updatingId === donation._id ? t("Deleting...") : t("Delete")}
                      </button>}
                      
                      {pendingReviews.find(r => r._id === donation._id) && (
                        <button onClick={() => setRateModalData({...pendingReviews.find(r => r._id === donation._id), isCurrentUserDonor: true})} className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-xs border border-amber-200 transition flex items-center justify-center gap-2 cursor-pointer">
                          <Heart className="w-4 h-4" /> {t("Rate Receiver")}
                        </button>
                      )}`;
s = s.replace(oldAction, newAction);

// 5. Render Modal at the end
s = s.replace(`      </div>\n    </div>\n  );\n};\n\nexport default MyClothDonations;`, `      </div>\n      <RateModal isOpen={!!rateModalData} donation={rateModalData} onClose={() => setRateModalData(null)} onReviewComplete={() => { setRateModalData(null); fetchMyDonations(); }} />\n    </div>\n  );\n};\n\nexport default MyClothDonations;`);

fs.writeFileSync('client/src/pages/cloth/MyClothDonations.jsx', s);
console.log('Fixed MyClothDonations');

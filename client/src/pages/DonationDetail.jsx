import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Clock, MapPin, PackageCheck, Truck, ShieldCheck, QrCode, AlertTriangle, Check, ArrowLeft, Info, Handshake, HeartHandshake } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TransferTimeline } from '../components/TransferTimeline';
import { ChatBox } from '../components/ChatBox';
import { ReviewForm } from '../components/ReviewForm';
import { ReportModal } from '../components/ReportModal';

const DonationDetail = () => {
  const { type, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useNotifications();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestedQty, setRequestedQty] = useState(1);
  const [requestedClothItems, setRequestedClothItems] = useState({});
  const [myRequestedIds, setMyRequestedIds] = useState(new Set());
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [urgency, setUrgency] = useState('LOW');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await api.get(`/${type}/donations/${id}`);
        setDonation(res.data);
        
        if (type !== 'food' && res.data.items) {
          const initialItems = {};
          res.data.items.forEach(item => {
            if (item._id) initialItems[item._id] = item.quantity;
          });
          setRequestedClothItems(initialItems);
        }
        
        // Fetch user's requests to see if they already requested this
        if (user && !user.role.includes('Donor')) {
          const reqs = await api.get(`/${type}/requests/receiver`);
          const existing = reqs.data.find(r => 
            (r.donation._id === id || r.donation === id) && 
            ['PENDING', 'ACCEPTED'].includes(r.status)
          );
          if (existing) {
            setMyRequestedIds(prev => new Set([...prev, id]));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [type, id]);

  const [pendingReviewObj, setPendingReviewObj] = useState(null);

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
  }, [donation, user, hasReviewed]);

  useEffect(() => {
    const handleUpdate = () => {
      api.get(`/${type}/donations/${id}`).then(res => setDonation(res.data)).catch(e => console.log(e));
    };
    socket.on('TRANSFER_UPDATE', handleUpdate);
    socket.on('FOOD_REQUESTED', handleUpdate);
    socket.on('CLOTH_REQUESTED', handleUpdate);
    socket.on('REQUEST_ACCEPTED', handleUpdate);
    socket.on('CLOTH_REQUEST_ACCEPTED', handleUpdate);
    socket.on('DONATION_COMPLETED', handleUpdate);
    socket.on('CLOTH_DONATION_COMPLETED', handleUpdate);
    return () => {
      socket.off('TRANSFER_UPDATE', handleUpdate);
      socket.off('FOOD_REQUESTED', handleUpdate);
      socket.off('CLOTH_REQUESTED', handleUpdate);
      socket.off('REQUEST_ACCEPTED', handleUpdate);
      socket.off('CLOTH_REQUEST_ACCEPTED', handleUpdate);
      socket.off('DONATION_COMPLETED', handleUpdate);
      socket.off('CLOTH_DONATION_COMPLETED', handleUpdate);
    };
  }, [type, id]);

  const getReceiverLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported.'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(err.code === 1 ? 'Location permission denied.' : 'GPS signal lost or unavailable.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  const handleRequest = async () => {
    if (user.role.includes('Donor')) {
      return showToast('toastTitle_roleRestriction', 'toastMsg_donorsCannotRequestItems');
    }
    try {
      setRequesting(true);
      
      let locData = {};
      try {
        locData = await getReceiverLocation();
      } catch (locErr) {
        setRequesting(false);
        return showToast('toastTitle_requestError', locErr.message);
      }

      const payload = { 
        donationId: donation._id,
        lat: locData.lat,
        lng: locData.lng,
        accuracy: locData.accuracy
      };

      if (type === 'food') {
        payload.requestedQuantity = requestedQty;
      } else {
        payload.requestedItems = Object.keys(requestedClothItems).map(itemId => ({
          itemId,
          quantity: requestedClothItems[itemId]
        })).filter(i => i.quantity > 0);
        
        if (payload.requestedItems.length === 0) {
          setRequesting(false);
          return showToast('toastTitle_requestError', 'Please select at least one item to request.');
        }
      }
      await api.post(`/${type}/requests`, payload);
      setMyRequestedIds(prev => new Set([...prev, donation._id]));
      showToast('toastTitle_requestSubmitted', 'toastMsg_yourRequestIsPendingDonorApproval');
    } catch (err) {
      showToast('toastTitle_requestError', err.response?.data?.message || t('toastMsg_errorSubmittingRequest'));
    } finally {
      setRequesting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-100">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t("Donation Not Found")}</h2>
          <p className="text-slate-500 mb-6">{t("The donation you're looking for might have been removed or completed.")}</p>
          <Button onClick={() => navigate('/explore')} className="w-full bg-slate-900 hover:bg-slate-800">
            {t("Browse Available Donations")}
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !donation) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  }

  const isFood = type === 'food';
  const isAvailable = donation.status === 'AVAILABLE';
  const isAlreadyRequested = myRequestedIds.has(donation._id) || (donation.requests && donation.requests.some(req => req.receiver === user?._id && req.status === 'PENDING'));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{isFood ? (donation.foodName || donation.title) : `${donation.clothingCategory} - ${donation.clothingType}`}</h1>
          </div>
          <Badge className={isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
            {t(donation.status)}
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="h-64 bg-slate-100 relative">
                {donation.images && donation.images.length > 0 ? (
                  <img src={donation.images[0]} alt={t("Donation")} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <PackageCheck className="w-16 h-16" />
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8">
                {/* We pick up from the terminal output */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">{isFood ? (donation.foodName || donation.title) : `${donation.clothingCategory} - ${donation.clothingType}`}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {donation.donor?.name?.charAt(0) || 'D'}
                        </div>
                        <span className="font-semibold">{donation.donor?.name || 'Anonymous Donor'}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-1">{t("Quantity")}</p>
                    <p className="text-lg font-black text-slate-900">{donation.quantity} {isFood ? donation.unit : 'items'}</p>
                  </div>
                  {isFood && <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t("Serves")}</p>
                      <p className="text-lg font-black text-slate-900">~{donation.peopleServed} {t("People")}</p>
                    </div>}
                  {isFood && isAvailable && !isAlreadyRequested && !user.role.includes('Donor') && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 col-span-2">
                      <p className="text-xs font-semibold text-emerald-700 mb-2">{t("Request Quantity")}</p>
                      <div className="flex items-center gap-3">
                        <input type="number" min="1" max={donation.quantity} value={requestedQty} onChange={e => setRequestedQty(Math.min(Math.max(1, parseInt(e.target.value)||1), donation.quantity))} className="w-24 p-2 border border-emerald-200 rounded-lg text-center font-bold text-emerald-900" />
                        <span className="text-sm text-emerald-700">{donation.unit} ({t("Max:")} {donation.quantity})</span>
                      </div>
                    </div>
                  )}
                  {!isFood && <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{t("Size / Condition")}</p>
                      <p className="text-lg font-black text-slate-900">{donation.size} / {donation.condition}</p>
                    </div>}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex gap-3 text-sm">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700">{t("Availability Window")}</p>
                      <p className="text-slate-500 mt-0.5">
                        {new Date(donation.availableFrom).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
                          {isFood && donation.expiryTime && (
                            <>
                              {' - '}
                              {new Date(donation.expiryTime).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
                            </>
                          )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-700">{t("Pickup Area")}</p>
                      <p className="text-slate-500 mt-0.5">
                        {donation.approximateLocation?.area || donation.approximateLocation?.city}
                        {!isAvailable && donation.preciseLocation?.address && <span className="block mt-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                            {t("Precise:")} {donation.preciseLocation.address}
                          </span>}
                      </p>
                      {isAvailable && <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("Precise location hidden until request is accepted.")}</p>}
                    </div>
                  </div>
                </div>

                {isFood && <>
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900">{t("Food Details & Safety")}</h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {donation.preparationTime && <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500">{t("Prepared:")} </span>
                            <span className="text-slate-800">{new Date(donation.preparationTime).toLocaleString(i18n.language, [], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}</span>
                          </div>}
                        {donation.packaging && <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500">{t("Packaging:")} </span>
                            <span className="text-slate-800">{donation.packaging}</span>
                          </div>}
                        {donation.storageCondition && <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500">{t("Storage:")} </span>
                            <span className="text-slate-800">{donation.storageCondition}</span>
                          </div>}
                      </div>
                      {donation.allergens && donation.allergens.length > 0 && donation.allergens[0] !== 'None' && <div className="mt-2 flex flex-wrap gap-2">
                          {donation.allergens.map(a => <Badge key={a} className="bg-red-50 text-red-700 border-red-200">{t("Allergen:")} {a}</Badge>)}
                        </div>}
                    </div>
                    
                    {donation.foodItems && donation.foodItems.length > 0 && <div className="space-y-3 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900">{t("Contents")}</h4>
                        <div className="flex flex-col gap-2">
                          {donation.foodItems.map((item, idx) => {
                      const isExpired = item.status === 'EXPIRED';
                      return <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between ${isExpired ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                  <div>
                                    <p className={`font-semibold ${isExpired ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                                      {item.foodName} <span className="font-normal text-xs opacity-75">({item.quantity} {item.unit})</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {t("Exp:")} {new Date(item.expiryTime).toLocaleString(i18n.language, [], {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                                    </p>
                                  </div>
                                  <div>
                                    {isExpired ? <Badge variant="destructive" className="bg-red-100 text-red-700 border border-red-200 shadow-none">{t("Expired")}</Badge> : <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-none hover:bg-emerald-100">{t("Available")}</Badge>}
                                  </div>
                               </div>;
                    })}
                        </div>
                      </div>}
                  </>}

                {!isFood && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{t("Clothing Items")}</h4>
                        {donation.items && donation.items.length > 0 && (
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                            {t("Total Pieces:")} {donation.items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
                          </span>
                        )}
                      </div>
                      
                      {donation.items && donation.items.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {donation.items.map((item, idx) => (
                              <div key={idx} className="p-3 rounded-lg border bg-indigo-50/50 border-indigo-100 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold text-indigo-900">
                                      {t(item.recipientCategory)} — {t(item.type)} — {item.size} — {item.quantity} {t("pieces")}
                                    </p>
                                    <p className="text-xs text-indigo-700 mt-1 flex gap-3">
                                      <span>{t("Condition:")} <b>{t(item.condition)}</b></span>
                                      {item.season && <span>{t("Season:")} <b>{t(item.season)}</b></span>}
                                    </p>
                                  </div>
                                  {!user.role.includes('Donor') && isAvailable && !isAlreadyRequested && (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="0" 
                                        max={item.quantity} 
                                        value={requestedClothItems[item._id || idx] ?? 0} 
                                        onChange={e => setRequestedClothItems(prev => ({...prev, [item._id || idx]: Math.min(Math.max(0, parseInt(e.target.value)||0), item.quantity)}))} 
                                        className="w-16 p-1.5 text-sm border border-indigo-200 rounded text-center font-bold text-indigo-900" 
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {/* Fallback for completely unmapped old single-item without items array */}
                          <div>
                            <p className="text-xs text-slate-500">{t("Category & Type")}</p>
                            <p className="font-bold text-slate-700">{donation.clothingCategory} - {donation.clothingType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">{t("Size & Condition")}</p>
                            <p className="font-bold text-slate-700">{donation.size} / {donation.condition}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {donation.description && <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-2">{t("Description")}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{donation.description}</p>
                  </div>}

              </div>

              <div className="mt-8">
                <Button size="lg" className={`w-full py-4 text-lg gap-2 ${isAlreadyRequested || !isAvailable ? 'bg-slate-200 text-slate-500 cursor-not-allowed border-none' : isFood ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`} disabled={isAlreadyRequested || !isAvailable || requesting} onClick={handleRequest} isLoading={requesting}>
                  <HeartHandshake className="w-5 h-5" />
                  {isAlreadyRequested ? 'Request Pending' : !isAvailable ? 'Not Available' : `Request ${isFood ? 'Food' : 'Clothes'}`}
                </Button>
              </div>

            </div>
          </div>
        </div>

        {/* Transfer Timeline & Chat - Render if Donor or Accepted Receiver and status is >= ACCEPTED */}
        {donation && user && (donation.donor?._id === user._id || donation.donor === user._id || donation.acceptedReceiver?._id === user._id || donation.acceptedReceiver === user._id) && !['AVAILABLE', 'REQUESTED'].includes(donation.status) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <TransferTimeline donation={donation} isDonor={donation.donor?._id === user._id || donation.donor === user._id} onUpdate={updatedData => setDonation(prev => ({
          ...prev,
          status: updatedData.status
        }))} />
            
            <ChatBox moduleType={type} donationId={donation._id} />
          </div>}

        {/* Review Form - Render if completed and not reviewed */}
        {pendingReviewObj && user && !hasReviewed && <ReviewForm donation={pendingReviewObj} isDonor={pendingReviewObj.donor?._id === user._id || pendingReviewObj.donor === user._id} onReviewComplete={() => { setHasReviewed(true); setPendingReviewObj(null); }} onReport={() => setShowReportModal(true)} />}
      </div>

      {showReportModal && <ReportModal donation={donation} reportedUserId={donation.donor?._id === user._id || donation.donor === user._id ? donation.acceptedReceiver?._id || donation.acceptedReceiver : donation.donor?._id || donation.donor} onClose={() => setShowReportModal(false)} />}
    </div>
  );
};
export default DonationDetail;
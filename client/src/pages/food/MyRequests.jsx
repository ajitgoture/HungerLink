import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Phone, MapPin, Clock, Utensils, Heart } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ProgressTracker from '../../components/ProgressTracker';
import ConnectedDetailsModal from '../../components/ConnectedDetailsModal';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { RateModal } from '../../components/RateModal';
import PickupVerification from '../../components/PickupVerification';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
const MyRequests = () => {
  const { t, i18n } = useTranslation();
  
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [rateModalData, setRateModalData] = useState(null);
  const {
    showToast
  } = useNotifications();
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/food/requests/receiver');
      setRequests(data || []);
      try {
        const revRes = await api.get('/reviews/pending');
        setPendingReviews(revRes.data || []);
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching receiver requests:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMyRequests();
  }, []);
  const {
    socket
  } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = () => {
      fetchMyRequests();
    };
    socket.on('REQUEST_ACCEPTED', handleStatusUpdate);
    socket.on('REQUEST_NOT_SELECTED', handleStatusUpdate);
    socket.on('FALLBACK_ACCEPTED', handleStatusUpdate);
    socket.on('FOOD_REQUESTED', handleStatusUpdate);
    return () => {
      socket.off('REQUEST_ACCEPTED', handleStatusUpdate);
      socket.off('REQUEST_NOT_SELECTED', handleStatusUpdate);
      socket.off('FALLBACK_ACCEPTED', handleStatusUpdate);
      socket.off('FOOD_REQUESTED', handleStatusUpdate);
    };
  }, [socket]);
  const handleConfirmReceived = async request => {
    try {
      setConfirmingId(request._id);
      const {
        data
      } = await api.patch(`/food/requests/${request._id}/confirm-received`);
      showToast('toastTitle_donationCompleted', data.message || t('toastMsg_theFoodDonationHasBeenCompletedSuccessfully'));
      setSuccessMessage(data.message || 'Thank you! The food donation has been completed successfully.');
      fetchMyRequests();
    } catch (err) {
      showToast('toastTitle_error', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_errorConfirmingFoodReception'));
    } finally {
      setConfirmingId(null);
    }
  };
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {t("Receiver Request Tracker")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("My Requests 📋")}</h1>
            <p className="text-xs text-slate-500">{t("Track real-time food requests, view live donor/receiver location maps, and confirm reception.")}</p>
          </div>

          <Link to="/food/receiver-dashboard" className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> {t("Receiver Dashboard")}
          </Link>
        </div>

        {/* Global Success Banner */}
        {successMessage && <div className="p-5 rounded-3xl bg-teal-600 text-white shadow-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-teal-200 flex-shrink-0" />
              <div>
                <h4 className="font-extrabold text-base">{t("Donation Complete!")}</h4>
                <p className="text-xs text-teal-100">{successMessage}</p>
              </div>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition cursor-pointer">
              {t("Dismiss")}
            </button>
          </div>}

        {/* Requests List */}
        {loading ? <div className="py-16 text-center text-slate-400">{t("Loading your food requests...")}</div> : requests.length === 0 ? <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">{t("You Haven't Requested Any Food")}</h3>
            <p className="text-xs text-slate-500">{t("Browse available food donations in your city and click \"I Want Food\".")}</p>
            <Link to="/food/available" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
              {t("Browse Available Food")}
            </Link>
          </div> : <div className="space-y-8">
            {requests.map(req => {
          const donation = req.donation;
          const donor = req.donor;
          const isAccepted = ['ACCEPTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'RECEIVED', 'COMPLETED'].includes(req.status);
          const canConfirmReceived = ['ACCEPTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(req.status) && req.status !== 'COMPLETED';
          return <div key={req._id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500">
                        {t("Donor:")} <strong className="text-slate-900">{donor?.name || 'Food Donor'}</strong> ({donor?.city})
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">{donation?.foodName || 'Food Item'}</h3>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Progress Tracker Stepper */}
                  <ProgressTracker status={req.status} />

                  {/* Live Location Map Component for Accepted Requests */}
                  {isAccepted && <div className="pt-2 border-t border-slate-100">
                      <LiveTrackingMap donation={donation} isDonorView={false} />
                    </div>}

                  <PickupVerification request={req} isDonorView={false} onUpdate={() => fetchMyRequests()} />

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>{t("Requested:")} {new Date(req.requestedAt).toLocaleString(i18n.language, )}</p>
                      {req.completedAt && <p className="text-emerald-700 font-bold">
                          {t("Completed:")} {new Date(req.completedAt).toLocaleString(i18n.language, )}
                        </p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      {/* View Donor Contact & Map */}
                      {isAccepted && <button onClick={() => setActiveModalRequest(req)} className="flex-1 sm:flex-none py-3 px-5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-xs border border-teal-200 transition flex items-center justify-center gap-2 cursor-pointer">
                          <Phone className="w-4 h-4" /> {t("View Donor Contact Details")}
                        </button>}

                      {/* Confirm Food Received Button */}
                      {canConfirmReceived && <button onClick={() => handleConfirmReceived(req)} disabled={confirmingId === req._id} className="flex-1 sm:flex-none py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                          <CheckCircle2 className="w-4 h-4 stroke-[3]" /> {t("Confirm Food Received")}
                        </button>}
                    </div>
                  </div>
                </div>;
        })}
          </div>}

        {/* Modal for Unlocked Connection Details */}
        {activeModalRequest && <ConnectedDetailsModal isOpen={!!activeModalRequest} onClose={() => setActiveModalRequest(null)} donation={activeModalRequest.donation} donor={activeModalRequest.donor} isDonorView={false} />}

      </div>
    </div>;
};
export default MyRequests;
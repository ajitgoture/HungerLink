import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Clock, MapPin, CheckCircle2, Truck, User, Navigation } from 'lucide-react';
import api from '../../services/api';
import ClickablePhoneNumber from '../../components/ClickablePhoneNumber';
import StatusBadge from '../../components/StatusBadge';
import ProgressTracker from '../../components/ProgressTracker';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { RateModal } from '../../components/RateModal';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
const MyDonations = () => {
  const { t, i18n } = useTranslation();
  
  
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { showToast } = useNotifications();
  const [pendingReviews, setPendingReviews] = useState([]);
  const [rateModalData, setRateModalData] = useState(null);
  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/food/donations/my-donations');
      setDonations(data || []);
      try {
        const revRes = await api.get('/reviews/pending');
        setPendingReviews(revRes.data || []);
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching my donations:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMyDonations();
  }, []);
  const {
    socket
  } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchMyDonations();
    };
    socket.on('DONATION_EXPIRED', handleRefresh);
    socket.on('FOOD_REQUESTED', handleRefresh);
    socket.on('FALLBACK_ACCEPTED', handleRefresh);
    return () => {
      socket.off('DONATION_EXPIRED', handleRefresh);
      socket.off('FOOD_REQUESTED', handleRefresh);
      socket.off('FALLBACK_ACCEPTED', handleRefresh);
    };
  }, [socket]);
  const handleSetTransferMethod = async (donationId, method) => {
    try {
      setUpdatingId(donationId);
      await api.post('/food/location/transfer-method', {
        donationId,
        transferMethod: method
      });
      showToast('toastTitle_transferMethodSet', 'toastMsg_statusUpdatedToMethodPickupReadyForPickupOutForDelivery');
      fetchMyDonations();
    } catch (err) {
      showToast('toastTitle_error', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_errorSettingTransferMethod'));
    } finally {
      setUpdatingId(null);
    }
  };
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {t("Food Donor Management")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Manage My Donations 🍲")}</h1>
            <p className="text-xs text-slate-500">{t("Track all food items posted, choose transfer method, and share live location with accepted receivers.")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/food/donate" className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer">
              <PlusCircle className="w-4 h-4" /> {t("+ Donate Food")}
            </Link>
            <Link to="/food/donor-dashboard" className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> {t("Dashboard")}
            </Link>
          </div>
        </div>

        {/* Donations List */}
        {loading ? <div className="py-16 text-center text-slate-400">{t("Loading your food donations...")}</div> : donations.length === 0 ? <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-800">{t("No Food Donations Posted")}</h3>
            <p className="text-xs text-slate-500">{t("Post surplus food meals to help people in need nearby.")}</p>
            <Link to="/food/donate" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md">
              <PlusCircle className="w-4 h-4" /> {t("Post Food Donation Now")}
            </Link>
          </div> : <div className="space-y-8">
            {donations.map(donation => {
          const acceptedReceiver = donation.acceptedReceiver;
          const isAccepted = ['ACCEPTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(donation.status);
          return <div key={donation._id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          {donation.foodType}
                        </span>
                        <span className="text-xs text-slate-400">{t("City:")} {donation.approximateLocation?.city}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-1">{donation.foodName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {donation.quantity} {donation.unit} {t("• Serves ~")}{donation.peopleServed} {t("people")}
                      </p>
                    </div>
                    <StatusBadge status={donation.status} />
                  </div>

                  {/* Stepper */}
                  <ProgressTracker status={donation.status} />

                  {/* Accepted Receiver Info */}
                  {acceptedReceiver && <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-teal-800 uppercase">{t("Accepted Receiver")}</p>
                          <p className="font-extrabold text-slate-900 text-sm">{acceptedReceiver.name}</p>
                        </div>
                      </div>
                      <ClickablePhoneNumber 
                        phone={acceptedReceiver.phone}
                        showIcon={true}
                        iconClassName="w-4 h-4 text-teal-600"
                        textClassName="font-bold text-teal-700 hover:underline"
                      />
                    </div>}

                  {/* Transfer Method Selector */}
                  {isAccepted && <div className="space-y-4 pt-3 border-t border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            {t("How do you want to transfer the food?")}
                          </h4>
                          <p className="text-[11px] text-slate-500">{t("Select pickup or delivery to initiate live location sharing.")}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleSetTransferMethod(donation._id, 'PICKUP')} disabled={updatingId === donation._id} className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${donation.status === 'READY_FOR_PICKUP' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t("Ready for Pickup")}
                          </button>

                          <button type="button" onClick={() => handleSetTransferMethod(donation._id, 'DELIVERY')} disabled={updatingId === donation._id} className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${donation.status === 'OUT_FOR_DELIVERY' ? 'bg-cyan-600 text-white shadow-md' : 'bg-white hover:bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                            <Truck className="w-3.5 h-3.5" /> {t("Deliver Food")}
                          </button>
                        </div>
                      </div>

                      {/* Live Tracking Map Component */}
                      <LiveTrackingMap donation={donation} isDonorView={true} />
                    </div>}

                </div>;
        })}
          </div>}

      </div>
    </div>;
};
export default MyDonations;
import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowLeft, User, MapPin, Clock, HeartHandshake, Phone } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ConnectedDetailsModal from '../../components/ConnectedDetailsModal';
import PickupVerification from '../../components/PickupVerification';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
const RequestsReceived = () => {
  const { t, i18n } = useTranslation();
  
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const {
    showToast
  } = useNotifications();
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const {
        data
      } = await api.get('/food/requests/donor');
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching donor requests:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRequests();
  }, []);
  const {
    socket
  } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = data => {
      // Append the new request to the top of the list
      if (data.request) {
        setRequests(prev => {
          // Check for duplicate just in case
          if (prev.find(r => r._id === data.request._id)) return prev;

          // Re-sort logic can be complex, but simply prepending works for live updates.
          // The next fetch will sort it properly.
          return [data.request, ...prev];
        });
      }
    };
    socket.on('FOOD_REQUESTED', handleNewRequest);
    return () => socket.off('FOOD_REQUESTED', handleNewRequest);
  }, [socket]);
  const handleAccept = async requestId => {
    try {
      setProcessingId(requestId);
      await api.patch(`/food/requests/${requestId}/accept`);
      showToast('toastTitle_requestAccepted', 'toastMsg_theReceiverHasBeenNotifiedWithYourContactAndPickupDetails');
      fetchRequests();
    } catch (err) {
      showToast('toastTitle_acceptError', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_errorAcceptingRequest'));
    } finally {
      setProcessingId(null);
    }
  };
  const handleReject = async requestId => {
    try {
      setProcessingId(requestId);
      await api.patch(`/food/requests/${requestId}/reject`);
      showToast('toastTitle_requestStatusUpdate', 'toastMsg_requestRejected');
      fetchRequests();
    } catch (err) {
      showToast('toastTitle_rejectError', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_errorRejectingRequest'));
    } finally {
      setProcessingId(null);
    }
  };
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {t("Donor Request Management")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Requests Received 📥")}</h1>
            <p className="text-xs text-slate-500">{t("Review requests from receivers seeking your food donations and select one to accept.")}</p>
          </div>

          <Link to="/food/donor-dashboard" className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition">
            <ArrowLeft className="w-4 h-4" /> {t("Donor Dashboard")}
          </Link>
        </div>

        {/* Requests List */}
        {loading ? <div className="py-16 text-center text-slate-400">{t("Loading incoming requests...")}</div> : requests.length === 0 ? <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">{t("No Requests Received Yet")}</h3>
            <p className="text-xs text-slate-500">{t("When receivers request your food, they will appear here in real time.")}</p>
          </div> : <div className="space-y-4">
            {requests.map(req => {
          const receiver = req.receiver;
          const donation = req.donation;
          return <div key={req._id} className={`bg-white rounded-3xl p-6 border shadow-md transition-all duration-200 flex flex-col items-start justify-between gap-6 ${req.status === 'ACCEPTED' ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
                  {/* Left Info */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full"><div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {receiver?.name || 'Food Receiver'}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {receiver?.city || 'City'}
                        </p>
                      </div>
                      <div className="ml-auto md:ml-2">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>

                    {req.status === 'PENDING' && req.matchData && <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-3">
                        <div className="radial-progress text-emerald-600 bg-white shadow-sm border border-emerald-100 rounded-full flex items-center justify-center font-black text-xs h-10 w-10">
                          {req.matchData.score}%
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-emerald-900">{t("Recommended Match")}</p>
                          <p className="text-emerald-700">
                            {req.matchData.metrics?.distanceKm} {t("km away ? High urgency score")}
                          </p>
                        </div>
                      </div>}

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{t("Food:")} {donation?.foodName || 'Donation Item'}</p>
                      <p className="text-slate-600">
                        {donation?.quantity} {donation?.unit} • {donation?.foodType}
                      </p>
                      <p className="text-[11px] text-slate-400 pt-1">
                        {t("Requested on:")} {new Date(req.requestedAt).toLocaleString(i18n.language, [], {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap md:flex-col items-center gap-2.5 w-full md:w-auto">
                    {req.status === 'PENDING' && <>
                        <button onClick={() => handleAccept(req._id)} disabled={processingId === req._id} className="flex-1 md:w-36 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                          <Check className="w-4 h-4 stroke-[3]" /> {t("Accept")}
                        </button>
                        <button onClick={() => handleReject(req._id)} disabled={processingId === req._id} className="flex-1 md:w-36 py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                          <X className="w-4 h-4" /> {t("Reject")}
                        </button>
                      </>}

                    {req.status === 'ACCEPTED' && <button onClick={() => setActiveModalRequest(req)} className="w-full md:w-44 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <Phone className="w-4 h-4" /> {t("View Connected Contact")}
                      </button>}
                  </div>
                </div>
                <div className="w-full">
                  <PickupVerification request={req} isDonorView={true} onUpdate={() => fetchRequests()} />
                </div>
              </div>;
        })}
          </div>}

        {/* Modal for Accepted Request Details */}
        {activeModalRequest && <ConnectedDetailsModal isOpen={!!activeModalRequest} onClose={() => setActiveModalRequest(null)} donation={activeModalRequest.donation} receiver={activeModalRequest.receiver} isDonorView={true} />}

      </div>
    </div>;
};
export default RequestsReceived;
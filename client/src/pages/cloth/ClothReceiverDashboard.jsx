import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shirt, Search, MapPin, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import api from '../../services/api';
const ClothReceiverDashboard = () => {
  const {
    t
  } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchReceiverData = async () => {
    try {
      const [requestsRes, availableRes] = await Promise.all([api.get('/cloth/requests/receiver'), api.get('/cloth/donations/available')]);
      setRequests(requestsRes.data || []);
      setAvailableCount((availableRes.data || []).length);
    } catch (err) {
      console.error('Error fetching receiver dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReceiverData();
  }, []);
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter(r => ['ACCEPTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(r.status)).length;
  const completedRequests = requests.filter(r => ['RECEIVED', 'COMPLETED'].includes(r.status)).length;
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-200">
              {t("Clothes Receiver Portal")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Clothes Receiver Dashboard")}</h1>
            <p className="text-xs text-slate-500">{t("Explore available apparel, track request status, and access live delivery tracking.")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cloth/available" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition">
              <Search className="w-4 h-4" /> {t("Browse Available Clothes")}
            </Link>
            <Link to="/cloth/map" className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition">
              <MapPin className="w-4 h-4 text-violet-600" /> {t("Map Explorer")}
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500">{t("Available Nearby")}</span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{availableCount}</h3>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/30 shadow-xs">
            <span className="text-xs font-bold text-amber-700">{t("Pending Requests")}</span>
            <h3 className="text-3xl font-black text-amber-800 mt-1">{pendingRequests}</h3>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-blue-200 bg-blue-50/30 shadow-xs">
            <span className="text-xs font-bold text-blue-700">{t("Accepted & Live")}</span>
            <h3 className="text-3xl font-black text-blue-800 mt-1">{acceptedRequests}</h3>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-teal-200 bg-teal-50/30 shadow-xs">
            <span className="text-xs font-bold text-teal-700">{t("Completed")}</span>
            <h3 className="text-3xl font-black text-teal-800 mt-1">{completedRequests}</h3>
          </div>
        </div>

        {/* Active Requests Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900">{t("Your Active Requests")}</h3>
            <Link to="/cloth/my-requests" className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
              {t("View All Requests")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? <div className="py-12 text-center text-slate-400">{t("Loading your requests...")}</div> : requests.length === 0 ? <div className="py-12 text-center space-y-3">
              <Shirt className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-500">{t("You haven't requested any clothes yet.")}</p>
              <Link to="/cloth/available" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-md">
                {t("Browse Available Clothes")}
              </Link>
            </div> : <div className="space-y-4">
              {requests.slice(0, 4).map(req => <div key={req._id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500">
                      {t("Donor:")} <strong className="text-slate-800">{req.donor?.name || 'Cloth Donor'}</strong>
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
  {req.donation?.items && req.donation.items.length > 0 ? (
    <>
      {t("Clothing Donation")}
<span className='text-xs text-slate-500 block mt-0.5'>
  {req.donation.items.length} {t("Items")} • {req.donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)} {t("Total Pieces")}
</span>
    </>
  ) : (
    <>
      {req.donation?.clothingType} ({req.donation?.clothingCategory})
      <span className='text-xs text-slate-500 block mt-0.5'>
        {t('Qty:')} {req.donation?.quantity} • {t('Size:')} {req.donation?.size}
      </span>
    </>
  )}
</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-800 uppercase">
                      {req.status}
                    </span>
                    <Link to="/cloth/my-requests" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition">
                      {t("Track Request")}
                    </Link>
                  </div>
                </div>)}
            </div>}
        </div>

      </div>
    </div>;
};
export default ClothReceiverDashboard;
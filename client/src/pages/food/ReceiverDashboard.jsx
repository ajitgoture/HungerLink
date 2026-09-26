import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, MapPin, CheckCircle2, Clock, Map, ListFilter, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
const ReceiverDashboard = () => {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchReceiverData = async () => {
    try {
      const [requestsRes, availableRes] = await Promise.all([api.get('/food/requests/receiver'), api.get('/food/donations/available')]);
      setRequests(requestsRes.data || []);
      setAvailableCount(availableRes.data?.length || 0);
    } catch (err) {
      console.error('Error fetching receiver data:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReceiverData();
  }, []);
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const acceptedRequests = requests.filter(r => r.status === 'ACCEPTED').length;
  const completedRequests = requests.filter(r => r.status === 'COMPLETED').length;
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              {t("Food Receiver Portal")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Receiver Dashboard")}</h1>
            <p className="text-xs text-slate-500">{t("Explore real-time food donations, track your active requests, and confirm food received.")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/food/available" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition">
              <Utensils className="w-5 h-5" /> {t("Browse Available Food")}
            </Link>
            <Link to="/food/map" className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition" title={t("Map View")}>
              <Map className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <span className="text-xs font-bold text-emerald-700">{t("Available Food Nearby")}</span>
            <h3 className="text-3xl font-black text-emerald-900 mt-1">{availableCount}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500">{t("My Requests")}</span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{totalRequests}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
            <span className="text-xs font-bold text-blue-700">{t("Accepted Requests")}</span>
            <h3 className="text-3xl font-black text-blue-900 mt-1">{acceptedRequests}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-xs">
            <span className="text-xs font-bold text-teal-700">{t("Completed Received")}</span>
            <h3 className="text-3xl font-black text-teal-900 mt-1">{completedRequests}</h3>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/food/my-requests" className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:border-emerald-400 hover:bg-emerald-50/50 shadow-xs flex items-center gap-2 transition">
            <span>{t("📋 My Active Requests")}</span>
            {pendingRequests > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingRequests} {t("Pending")}
              </span>}
          </Link>

          <Link to="/food/available" className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:border-teal-400 hover:bg-teal-50/50 shadow-xs flex items-center gap-2 transition">
            <span>{t("🍲 Explore Live Food Feed")}</span>
          </Link>
        </div>

        {/* Recent Requests Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900">{t("Your Sent Food Requests")}</h3>
            <Link to="/food/my-requests" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              {t("View All Requests")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? <div className="py-12 text-center text-slate-400">{t("Loading requests...")}</div> : requests.length === 0 ? <div className="py-12 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-500">{t("You haven't requested any food yet.")}</p>
              <Link to="/food/available" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
                <Utensils className="w-4 h-4" /> {t("Browse Available Food")}
              </Link>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.slice(0, 6).map(req => <div key={req._id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      {t("Donor:")} {req.donor?.name || 'Food Donor'}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">{req.donation?.foodName || 'Food Donation'}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {req.donation?.quantity} {req.donation?.unit} • {req.donation?.foodType}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span>{t("Requested:")} {new Date(req.requestedAt).toLocaleDateString(i18n.language, )}</span>
                    <Link to="/food/my-requests" className="font-bold text-emerald-600 hover:underline">
                      {t("Track →")}
                    </Link>
                  </div>
                </div>)}
            </div>}
        </div>

      </div>
    </div>;
};
export default ReceiverDashboard;
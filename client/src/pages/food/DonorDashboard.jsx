import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, PackageCheck, Clock, CheckCircle2, Heart, ListFilter, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
const DonorDashboard = () => {
  const { t, i18n } = useTranslation();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchDashboardData = async () => {
    try {
      const [donationsRes, requestsRes] = await Promise.all([api.get('/food/donations/my-donations'), api.get('/food/requests/donor')]);
      setDonations(donationsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error fetching donor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDashboardData();
  }, []);
  const totalDonations = donations.length;
  const availableCount = donations.filter(d => d.status === 'AVAILABLE').length;
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
  const acceptedCount = donations.filter(d => ['ACCEPTED', 'READY_FOR_PICKUP', 'READY_FOR_DELIVERY'].includes(d.status)).length;
  const completedCount = donations.filter(d => ['QR_VERIFIED', 'COMPLETED'].includes(d.status)).length;
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Main Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
              {t("Food Donor Portal")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Donor Dashboard")}</h1>
            <p className="text-xs text-slate-500">{t("Track surplus food posts, manage incoming requests, and view completed donations.")}</p>
          </div>

          <Link to="/food/donate" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition hover:-translate-y-0.5">
            <PlusCircle className="w-5 h-5" /> {t("+ Donate Food")}
          </Link>
        </div>

        {/* 5 Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500">{t("Total Donations")}</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalDonations}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <span className="text-xs font-bold text-emerald-700">{t("Available")}</span>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">{availableCount}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
            <span className="text-xs font-bold text-amber-700">{t("Requests Received")}</span>
            <h3 className="text-2xl font-black text-amber-800 mt-1">{pendingRequestsCount}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
            <span className="text-xs font-bold text-blue-700">{t("Accepted")}</span>
            <h3 className="text-2xl font-black text-blue-800 mt-1">{acceptedCount}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-xs">
            <span className="text-xs font-bold text-teal-700">{t("Completed")}</span>
            <h3 className="text-2xl font-black text-teal-800 mt-1">{completedCount}</h3>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/food/requests-received" className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:border-amber-400 hover:bg-amber-50/50 shadow-xs flex items-center gap-2 transition">
            <span>{t("📥 Requests Received")}</span>
            {pendingRequestsCount > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingRequestsCount}
              </span>}
          </Link>

          <Link to="/food/my-donations" className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:border-teal-400 hover:bg-teal-50/50 shadow-xs flex items-center gap-2 transition">
            <span>{t("🍲 Manage My Donations")}</span>
          </Link>
        </div>

        {/* Recent Food Posts List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900">{t("Your Recent Food Posts")}</h3>
            <Link to="/food/my-donations" className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
              {t("View All")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? <div className="py-12 text-center text-slate-400">{t("Loading food donations...")}</div> : donations.length === 0 ? <div className="py-12 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-500">{t("You haven't posted any food donations yet.")}</p>
              <Link to="/food/donate" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md">
                <PlusCircle className="w-4 h-4" /> {t("Post Your First Food Donation")}
              </Link>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.slice(0, 6).map(donation => <div key={donation._id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
                      {donation.foodType}
                    </span>
                    <StatusBadge status={donation.status} />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">{donation.foodName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {donation.quantity} {donation.unit} {t("• Serves ~")}{donation.peopleServed} {t("people")}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {t("Expires:")} {new Date(donation.expiryTime).toLocaleString(i18n.language, [], {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
                    </p>
                  </div>
                </div>)}
            </div>}
        </div>

      </div>
    </div>;
};
export default DonorDashboard;
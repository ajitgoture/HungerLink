import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Shirt, Clock, Calendar, CheckCircle2, Heart, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
const ClothDonorDashboard = () => {
  const { t, i18n } = useTranslation();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchDashboardData = async () => {
    try {
      const [donationsRes, requestsRes] = await Promise.all([api.get('/cloth/donations/my-donations'), api.get('/cloth/requests/donor')]);
      setDonations(donationsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err) {
      console.error('Error fetching cloth donor dashboard:', err);
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
  const acceptedCount = donations.filter(d => ['ACCEPTED'].includes(d.status)).length;
  const readyPickupCount = donations.filter(d => d.status === 'READY_FOR_PICKUP').length;
  const outDeliveryCount = donations.filter(d => d.status === 'OUT_FOR_DELIVERY').length;
  const completedCount = donations.filter(d => ['RECEIVED', 'COMPLETED'].includes(d.status)).length;
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              {t("Clothes Donor Portal")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Clothes Donor Dashboard")}</h1>
            <p className="text-xs text-slate-500">{t("Track apparel donations, review requests, manage delivery status, and share live location.")}</p>
          </div>

          <Link to="/cloth/donate" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition hover:-translate-y-0.5">
            <PlusCircle className="w-5 h-5" /> {t("+ Donate Clothes")}
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500">{t("Total")}</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalDonations}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700">{t("Available")}</span>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">{availableCount}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-amber-700">{t("Pending Requests")}</span>
            <h3 className="text-2xl font-black text-amber-800 mt-1">{pendingRequestsCount}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700">{t("Accepted")}</span>
            <h3 className="text-2xl font-black text-blue-800 mt-1">{acceptedCount}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-indigo-700">{t("Ready Pickup")}</span>
            <h3 className="text-2xl font-black text-indigo-800 mt-1">{readyPickupCount}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-cyan-200 bg-cyan-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-cyan-700">{t("Out Delivery")}</span>
            <h3 className="text-2xl font-black text-cyan-800 mt-1">{outDeliveryCount}</h3>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-xs">
            <span className="text-[11px] font-bold text-teal-700">{t("Completed")}</span>
            <h3 className="text-2xl font-black text-teal-800 mt-1">{completedCount}</h3>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/cloth/requests-received" className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:border-indigo-400 hover:bg-indigo-50/50 shadow-xs flex items-center gap-2 transition">
            <span>{t("📥 Requests Received")}</span>
            {pendingRequestsCount > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingRequestsCount}
              </span>}
          </Link>

          <Link to="/cloth/my-donations" className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:border-violet-400 hover:bg-violet-50/50 shadow-xs flex items-center gap-2 transition">
            <span>{t("👕 Manage My Donations & Live Tracking")}</span>
          </Link>
        </div>

        {/* Recent Posts List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900">{t("Your Recent Clothes Posts")}</h3>
            <Link to="/cloth/my-donations" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              {t("View All")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? <div className="py-12 text-center text-slate-400">{t("Loading clothes donations...")}</div> : donations.length === 0 ? <div className="py-12 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-500">{t("You haven't posted any clothes donations yet.")}</p>
              <Link to="/cloth/donate" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">
                <PlusCircle className="w-4 h-4" /> {t("Post Clothes Donation Now")}
              </Link>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.slice(0, 6).map(donation => <div key={donation._id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800">
                      {donation.clothingCategory} • {donation.size}
                    </span>
                    <StatusBadge status={donation.status} />
                  </div>

                  <div>
                    {donation.items && donation.items.length > 0 ? (
                      <>
                        <h4 className="text-base font-black text-slate-900">{t("Clothing Donation")}</h4>
<p className="text-xs text-slate-500 mt-0.5">
  {donation.items.length} {t("Items")} <br/> {donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)} {t("Total Pieces")}
</p>
                      </>
                    ) : (
                      <>
                        <h4 className="text-base font-black text-slate-900">{donation.clothingType}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t("Qty:")} {donation.quantity} • {t("Condition:")} {donation.condition}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      {t("Pickup Date:")} {donation.pickupDate || new Date(donation.availableFrom).toLocaleDateString(i18n.language, )}
                    </p>
                  </div>
                </div>)}
            </div>}
        </div>

      </div>
    </div>;
};
export default ClothDonorDashboard;
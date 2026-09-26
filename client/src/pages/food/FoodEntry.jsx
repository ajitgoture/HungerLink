import { useTranslation } from "react-i18next";
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, HeartHandshake, ArrowRight, Sparkles, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
const FoodEntry = () => {
  const { t, i18n } = useTranslation();
  
  
  const {
    user
  } = useAuth();
  const {
    showToast
  } = useNotifications();
  const navigate = useNavigate();
  const handleDonateClick = () => {
    if (!user) {
      navigate('/login', {
        state: {
          role: 'Food Donor',
          from: '/food/donor-dashboard'
        }
      });
    } else if (user.role === 'Food Receiver') {
      showToast('toastTitle_roleRestriction', 'toastMsg_yourAccountIsRegisteredAsAFoodReceiverSwitchToADonorAccountToPostFoodDonations');
      navigate('/food/receiver-dashboard');
    } else {
      navigate('/food/donor-dashboard');
    }
  };
  const handleReceiveClick = () => {
    if (!user) {
      navigate('/login', {
        state: {
          role: 'Food Receiver',
          from: '/food/receiver-dashboard'
        }
      });
    } else if (user.role === 'Food Donor') {
      showToast('toastTitle_roleRestriction', 'toastMsg_youAreLoggedInAsAFoodDonorYouCanBrowseFoodButYouNeedAReceiverAccountToManageRequests');
      navigate('/food/available');
    } else {
      navigate('/food/receiver-dashboard');
    }
  };
  return <div className="min-h-[85vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-600" />
            {t("Module 1: Real-Time Food System")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {t("Food Donation Platform 🍲")}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {t("Choose whether you want to donate surplus food or request food assistance. Powered by real-time need confirmation.")}
          </p>
        </div>

        {/* 2 Main Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Donate Food */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl hover:shadow-2xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {t("For Donors & Caterers")}
              </span>

              <h2 className="text-3xl font-black text-slate-900 mt-3 mb-3">
                {t("Donate Food")}
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {t("Have excess meals, event surplus, or grocery rations? Share them with verified local receivers with real-time request alerts.")}
              </p>

              <ul className="space-y-2 mb-8 border-t border-slate-100 pt-5 text-xs text-slate-500 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("Vegetarian, Non-Vegetarian & Mixed Food tags")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("Instant request notifications")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("Exact location privacy protected until acceptance")}
                </li>
              </ul>
            </div>

            <button onClick={handleDonateClick} className="w-full py-4 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all group-hover:gap-3 text-base cursor-pointer">
              <span>{t("I Want to Donate")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Card 2: Receive Food */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Utensils className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {t("For Receivers & Shelters")}
              </span>

              <h2 className="text-3xl font-black text-slate-900 mt-3 mb-3">
                {t("Receive Food")}
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {t("Looking for food support? View live food donations available in your city with approximate distance calculation.")}
              </p>

              <ul className="space-y-2 mb-8 border-t border-slate-100 pt-5 text-xs text-slate-500 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("Real-time updates without refreshing")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("Distance calculation using location services")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("1-Click request with status progress tracking")}
                </li>
              </ul>
            </div>

            <button onClick={handleReceiveClick} className="w-full py-4 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all group-hover:gap-3 text-base cursor-pointer">
              <span>{t("I Want Food")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </div>;
};
export default FoodEntry;
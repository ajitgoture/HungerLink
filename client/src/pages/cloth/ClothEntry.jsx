import { useTranslation } from "react-i18next";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shirt, HeartHandshake, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
const ClothEntry = () => {
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
      navigate('/login');
    } else if (user.role === 'Cloth Receiver' || user.role === 'Clothes Receiver') {
      showToast('toastTitle_roleRestriction', 'toastMsg_yourAccountIsRegisteredAsAClothReceiverSwitchToADonorAccountToPostClothesDonations');
      navigate('/cloth/available');
    } else {
      navigate('/cloth/donate');
    }
  };
  const handleReceiveClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/cloth/available');
    }
  };
  return <div className="min-h-[85vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-300 text-indigo-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {t("Module 2: Real-Time Clothes System")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {t("Clothes Donation Platform 👕")}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {t("Give usable apparel a second life or request clothing support. Powered by real-time updates & 2-way live tracking.")}
          </p>
        </div>

        {/* 2 Main Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Donate Clothes */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                {t("For Donors")}
              </span>

              <h2 className="text-3xl font-black text-slate-900 mt-3 mb-3">
                {t("Donate Clothes")}
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {t("Have gently used coats, shirts, pants, winter jackets, or uniforms? Share them directly with verified local receivers.")}
              </p>

              <ul className="space-y-2 mb-8 border-t border-slate-100 pt-5 text-xs text-slate-500 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {t("Category, Size, Season & Condition tags")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {t("Instant request notifications")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {t("Exact location privacy protected until acceptance")}
                </li>
              </ul>
            </div>

            <button onClick={handleDonateClick} className="w-full py-4 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all group-hover:gap-3 text-base cursor-pointer">
              <span>{t("I Want to Donate")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Card 2: Receive Clothes */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl hover:shadow-2xl hover:border-violet-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                <Shirt className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
                {t("For Receivers & Families")}
              </span>

              <h2 className="text-3xl font-black text-slate-900 mt-3 mb-3">
                {t("Receive Clothes")}
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {t("Need clothing support for winter or daily wear? Explore available clothes with distance calculation & 2-way live tracking.")}
              </p>

              <ul className="space-y-2 mb-8 border-t border-slate-100 pt-5 text-xs text-slate-500 font-semibold">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  {t("Filter by Size (XS - XXXL, Free Size), Gender & Season")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  {t("Live updates without page refresh")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  {t("Dominos-style 2-way GPS location map")}
                </li>
              </ul>
            </div>

            <button onClick={handleReceiveClick} className="w-full py-4 px-6 rounded-2xl font-extrabold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 transition-all group-hover:gap-3 text-base cursor-pointer">
              <span>{t("I Want Clothes")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </div>;
};
export default ClothEntry;
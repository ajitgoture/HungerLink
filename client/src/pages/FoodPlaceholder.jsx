import { useTranslation } from "react-i18next";
import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ArrowLeft, Clock, Sparkles } from 'lucide-react';
const FoodPlaceholder = () => {
  const {
    t
  } = useTranslation();
  return <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
          <Utensils className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          {t("Module 1 Ready for Implementation")}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {t("Food Donation Module")}
        </h1>

        <p className="text-slate-600 text-base leading-relaxed">
          {t("The Food Donation system workflow (Donor Dashboard, Food Requesting, Socket.IO updates, Leaflet mapping & Cloudinary uploads) will be unlocked in the next prompt!")}
        </p>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs text-left space-y-1.5">
          <p className="font-bold">{t("Planned Features:")}</p>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            <li>{t("Post surplus cooked/packaged meals with Veg/Non-Veg tags")}</li>
            <li>{t("Real-time receiver requests with instant donor alerts")}</li>
            <li>{t("Distance calculations & exact pickup location privacy release")}</li>
            <li>{t("Status flow: AVAILABLE → ACCEPTED → QR_VERIFIED → COMPLETED")}</li>
          </ul>
        </div>

        <div className="pt-2">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("Back to Home Page")}
          </Link>
        </div>
      </div>
    </div>;
};
export default FoodPlaceholder;
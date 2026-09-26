import { useTranslation } from "react-i18next";
import React from 'react';
import { Link } from 'react-router-dom';
import { HandHeart, ArrowLeft, Heart, ShieldCheck, Zap, Users } from 'lucide-react';
const AboutPlaceholder = () => {
  const {
    t
  } = useTranslation();
  return <div className="min-h-[85vh] bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <HandHeart className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t("About HungerLink")}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("Connecting surplus resources with real human needs through real-time confirmation and location intelligence.")}
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">{t("Our Social Mission")}</h2>
          <p className="text-slate-600 leading-relaxed">
            {t("HungerLink was built to eliminate third-party friction and long delays in community donation drives. Every day, thousands of tons of edible food and usable clothing are discarded while nearby individuals and shelters face critical shortages.")}
          </p>
          <p className="text-slate-600 leading-relaxed">
            {t("By unifying **Food and Clothes** donation under one intelligent real-time platform, HungerLink ensures that help reaches verified receivers swiftly, safely, and transparently.")}
          </p>
        </div>

        {/* Grid Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <Zap className="w-7 h-7 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-lg">{t("Instant Verification")}</h3>
            <p className="text-xs text-slate-500">{t("Socket.IO real-time notification alerts donors and receivers in milliseconds.")}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            <h3 className="font-bold text-slate-900 text-lg">{t("Location Privacy")}</h3>
            <p className="text-xs text-slate-500">{t("Exact addresses are kept private until donor accepts the request.")}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <Users className="w-7 h-7 text-cyan-500" />
            <h3 className="font-bold text-slate-900 text-lg">{t("Community First")}</h3>
            <p className="text-xs text-slate-500">{t("100% free, direct peer-to-peer connection for human dignity and support.")}</p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors gap-2 shadow-xs">
            <ArrowLeft className="w-4 h-4" />
            {t("Back to Home Page")}
          </Link>
        </div>

      </div>
    </div>;
};
export default AboutPlaceholder;
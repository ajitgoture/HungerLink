import { useTranslation } from "react-i18next";
import React from 'react';
import { Link } from 'react-router-dom';
import { Shirt, ArrowLeft, Clock, Sparkles } from 'lucide-react';
const ClothesPlaceholder = () => {
  const {
    t
  } = useTranslation();
  return <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
          <Shirt className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          {t("Module 2 – Coming Soon")}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {t("Clothes Donation Module")}
        </h1>

        <p className="text-slate-600 text-base leading-relaxed">
          {t("Give usable clothes a second life! This module will support size filtering, seasonal requirements, and direct community handovers.")}
        </p>

        <div className="pt-2">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("Back to Home Page")}
          </Link>
        </div>
      </div>
    </div>;
};
export default ClothesPlaceholder;
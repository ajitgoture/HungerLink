import { useTranslation } from "react-i18next";
import React from 'react';
import { Utensils, Shirt, Droplet, HeartHandshake, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
const Hero = () => {
  const {
    t
  } = useTranslation();
  const scrollToCategories = e => {
    e.preventDefault();
    const categoriesSection = document.getElementById('categories');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50 py-16 lg:py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-10 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-rose-100/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold">{t("Real-Time Need Confirmation Platform")}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {t("Give What You Can.")}{' '}
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {t("Receive What You Need.")}
              </span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t("HungerLink bridges compassionate donors with people in genuine need across")}{' '}
              <strong className="text-slate-900 font-semibold">{t("Food and Clothes")}</strong> {t("donations. Experience instant real-time verification, smart location matching, and transparent donation tracking.")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a href="#categories" onClick={scrollToCategories} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 shadow-xl shadow-teal-600/25 hover:shadow-2xl hover:shadow-teal-600/35 hover:-translate-y-0.5 transition-all duration-200 gap-2 group">
                {t("Start Donating")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#categories" onClick={scrollToCategories} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-base text-slate-700 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 shadow-md hover:shadow-lg transition-all duration-200 gap-2">
                {t("Find Help")}
              </a>
            </div>

            {/* Trust Markers */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-600" />
                <span>{t("Socket.IO Real-Time Updates")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t("Verified Direct Pickup")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <span>{t("100% Free & Community Driven")}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Cards & Graphics Grid */}
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              
              {/* Food Donation Visual Card */}
              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Utensils className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-1">{t("Food Sharing")}</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  {t("Hot meals, surplus rations & groceries shared directly.")}
                </p>
                <div className="mt-4 inline-flex items-center text-xs font-bold text-amber-600">
                  {t("Real-time Available →")}
                </div>
              </div>

              {/* Clothes Donation Visual Card */}
              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 mt-6 group">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shirt className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-1">{t("Clothes Drive")}</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  {t("Clean, usable apparel for winter & daily essential wear.")}
                </p>
                <div className="mt-4 inline-flex items-center text-xs font-bold text-indigo-600">
                  {t("Second Life →")}
                </div>
              </div>

              {/* Community Support Visual Card */}
              <div className="p-6 bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-3xl shadow-xl shadow-teal-600/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-xs">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-white text-lg mb-1">{t("Direct Help")}</h3>
                <p className="text-xs text-teal-100 leading-normal">
                  {t("Connecting heart-to-heart with zero middleman friction.")}
                </p>
                <div className="mt-4 inline-flex items-center text-xs font-bold text-white">
                  {t("Join Community →")}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>;
};
export default Hero;
import { useTranslation } from "react-i18next";
import React from 'react';
import { HeartHandshake, ArrowRight, Sparkles } from 'lucide-react';
const CallToAction = () => {
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
  return <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 text-white p-10 sm:p-16 shadow-2xl shadow-teal-900/20 overflow-hidden">
          
          {/* Background Ambient Circles */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              {t("Join the Movement Today")}
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {t("Every Donation Can Make a Difference")}
            </h2>

            <p className="text-base sm:text-lg text-teal-100 leading-relaxed max-w-2xl mx-auto">
              {t("Whether you have excess meals from an event or surplus clothes in your wardrobe - your contribution creates immediate real-world impact.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#categories" onClick={scrollToCategories} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl font-extrabold text-base text-slate-900 bg-white hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all duration-200 gap-2 group">
                <HeartHandshake className="w-5 h-5 text-teal-600" />
                {t("Donate Now")}
                <ArrowRight className="w-5 h-5 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#categories" onClick={scrollToCategories} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl font-extrabold text-base text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 transition-all duration-200">
                {t("Request Help")}
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>;
};
export default CallToAction;
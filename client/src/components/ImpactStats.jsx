import { useTranslation } from "react-i18next";
import React from 'react';
import { PackageCheck, Users, HeartHandshake, Layers, Info } from 'lucide-react';
const ImpactStats = () => {
  const {
    t
  } = useTranslation();
  const stats = [{
    label: t("Donations Shared"),
    value: '1,000+',
    description: t("Verified meals and clothes requests fulfilled."),
    icon: PackageCheck,
    color: 'text-teal-600 bg-teal-50 border-teal-200'
  }, {
    label: t("People Helped"),
    value: '750+',
    description: t("Individuals & families receiving immediate relief."),
    icon: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }, {
    label: t("Active Donors"),
    value: '500+',
    description: t("Generous community members registered on HungerLink."),
    icon: HeartHandshake,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
  }, {
    label: t("Donation Categories"),
    value: '2',
    description: t("Unified Food and Clothes donation modules."),
    icon: Layers,
    color: 'text-rose-600 bg-rose-50 border-rose-200'
  }];
  return <section className="py-16 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header & Demo Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12 border-b border-slate-800 pb-6">
          <div>
            <span className="text-teal-400 text-xs font-bold uppercase tracking-widest">{t("Platform Impact")}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{t("Making Real-World Difference")}</h2>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
            <Info className="w-4 h-4 text-teal-400" />
            <span>{t("Sample Metrics (Live MongoDB Integration Ready)")}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return <div key={idx} className="bg-slate-800/60 backdrop-blur-md rounded-3xl p-6 border border-slate-700/70 hover:border-teal-500/50 hover:bg-slate-800/90 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl border ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black tracking-tight text-white group-hover:text-teal-300 transition-colors">
                    {stat.value}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-200 mb-1">{stat.label}</h3>
                <p className="text-xs text-slate-400 leading-normal">{stat.description}</p>
              </div>;
        })}
        </div>

        <div className="mt-12 text-center">
          <a href="/impact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
            {t("View Live Community Impact")}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
        </div>

      </div>
    </section>;
};
export default ImpactStats;
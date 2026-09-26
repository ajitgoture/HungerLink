import { useTranslation } from "react-i18next";
import React from 'react';
import { Zap, Handshake, MapPin, Bell, ShieldLock, Sparkles } from 'lucide-react';
const WhyChooseUs = () => {
  const {
    t
  } = useTranslation();
  const features = [{
    title: t("Real-Time Updates"),
    description: t("Powered by Socket.IO, see newly posted food or clothes requests immediately without refreshing."),
    icon: Zap,
    badge: 'Instant Sync',
    color: 'bg-amber-50 text-amber-600 border-amber-200'
  }, {
    title: t("Direct Connection"),
    description: t("Seamless peer-to-peer matching connects donors with verified receivers, eliminating third-party friction."),
    icon: Handshake,
    badge: 'Zero Middleman',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  }, {
    title: t("Location-Based Matching"),
    description: t("Integrated map markers and Haversine distance calculations highlight local donations right near you."),
    icon: MapPin,
    badge: 'Geo-Distance',
    color: 'bg-teal-50 text-teal-600 border-teal-200'
  }, {
    title: t("Smart Notifications"),
    description: t("Stay informed every step of the way from request submission to pickup acceptance and delivery confirmation."),
    icon: Bell,
    badge: 'Live Status',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200'
  }, {
    title: t("Privacy and Security"),
    description: t("Exact addresses and contact numbers are protected and shared strictly after donor request acceptance."),
    icon: ShieldLock,
    badge: 'Privacy Protected',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  }];
  return <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            {t("Platform Advantages")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {t("Why Choose HungerLink")}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {t("Designed with advanced real-time architecture, precise location privacy controls, and transparent need verification.")}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
          const Icon = feat.icon;
          return <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-teal-200 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${feat.color} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-teal-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t("Built into MERN Core")}</span> →
                </div>
              </div>;
        })}

          {/* Bonus Card: Unified Architecture */}
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-6 backdrop-blur-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-white mb-3">
                {t("All-In-One Unified Platform")}
              </h3>
              <p className="text-teal-100 text-sm leading-relaxed">
                {t("No need for multiple separate apps. Food and Clothes donations seamlessly co-exist under one unified account and dashboard.")}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 text-xs font-bold text-teal-100">
              {t("Future-Ready Modular Design")}
            </div>
          </div>

        </div>

      </div>
    </section>;
};
export default WhyChooseUs;
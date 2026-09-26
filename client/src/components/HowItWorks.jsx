import { useTranslation } from "react-i18next";
import React from 'react';
import { MousePointerClick, FileText, CheckCircle2, HeartHandshake } from 'lucide-react';
const HowItWorks = () => {
  const {
    t
  } = useTranslation();
  const steps = [{
    number: '01',
    title: t("Choose a Category"),
    description: t("Select between Food or Clothes donation depending on what you wish to share or request."),
    icon: MousePointerClick,
    color: 'bg-teal-500 text-white',
    borderColor: 'border-teal-200'
  }, {
    number: '02',
    title: t("Donate or Request"),
    description: t("Donors post surplus food or items with details. Receivers submit verified requests with one click."),
    icon: FileText,
    color: 'bg-emerald-500 text-white',
    borderColor: 'border-emerald-200'
  }, {
    number: '03',
    title: t("Connect and Confirm"),
    description: t("Instant Socket.IO notifications alert both parties. Donors accept requests and share precise pickup details."),
    icon: CheckCircle2,
    color: 'bg-cyan-500 text-white',
    borderColor: 'border-cyan-200'
  }, {
    number: '04',
    title: t("Make an Impact"),
    description: t("Pick up or deliver the items, confirm reception, and complete the life-changing donation cycle."),
    icon: HeartHandshake,
    color: 'bg-rose-500 text-white',
    borderColor: 'border-rose-200'
  }];
  return <section id="how-it-works" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            {t("Simple 4-Step Process")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {t("How HungerLink Works")}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {t("Our platform simplifies direct peer-to-peer donation with real-time confirmation, privacy protection, and location guidance.")}
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
          const Icon = step.icon;
          return <div key={step.number} className="relative bg-slate-50/80 rounded-3xl p-8 border border-slate-200/70 hover:bg-white hover:shadow-xl hover:border-teal-200 transition-all duration-300 group flex flex-col justify-between">
                {/* Step Number Tag */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-3xl font-black text-slate-300 group-hover:text-teal-600 transition-colors">
                    {step.number}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connecting arrow indicator for desktop */}
                {index < steps.length - 1 && <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <span className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm">
                      →
                    </span>
                  </div>}
              </div>;
        })}
        </div>

      </div>
    </section>;
};
export default HowItWorks;
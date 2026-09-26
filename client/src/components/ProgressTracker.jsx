import React from 'react';
import { Check } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const ProgressTracker = ({ status }) => {
  const { t } = useTranslation();
  
  const steps = [
    { key: 'AVAILABLE', label: t("Available") },
    { key: 'REQUESTED', label: t("Requested") },
    { key: 'ACCEPTED', label: t("Accepted") },
    { key: 'READY_FOR_PICKUP', label: t("Ready / Delivery") },
    { key: 'COMPLETED', label: t("Completed") },
  ];

  const getStepIndex = (currentStatus) => {
    switch (currentStatus) {
      case 'AVAILABLE':
        return 0;
      case 'REQUESTED':
      case 'PENDING':
        return 1;
      case 'ACCEPTED':
        return 2;
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'RECEIVED':
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(status);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0" />
        
        {/* Active Progress Line */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                } ${isCurrent ? 'ring-4 ring-emerald-200 scale-110' : ''}`}
              >
                {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-bold mt-2 text-center transition-colors ${
                  isCurrent ? 'text-emerald-700 font-black' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;

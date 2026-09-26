import { useTranslation } from "react-i18next";
import React from 'react';
import { X } from 'lucide-react';
import { ReviewForm } from './ReviewForm';

export const RateModal = ({ donation, isOpen, onClose, onReviewComplete }) => {
  const { t } = useTranslation();

  if (!isOpen || !donation) return null;

  const handleReport = () => {
    // Navigating to detail page to report is fine, or we could just trigger another modal
    onClose();
  };

  const partnerName = donation.moduleType === 'food' 
    ? (donation.donor?.name || donation.acceptedReceiver?.name)
    : (donation.donor?.name || donation.acceptedReceiver?.name); 

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t("Rate your Experience")}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {t("You recently completed a transfer. Please rate them to keep HungerLink safe and reliable!")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <ReviewForm 
            donation={donation} 
            isDonor={donation.isCurrentUserDonor} 
            onReviewComplete={() => {
              if (onReviewComplete) onReviewComplete();
              onClose();
            }} 
            onReport={handleReport} 
          />
        </div>
      </div>
    </div>
  );
};

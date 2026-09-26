import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Button } from './ui';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
export const ReportModal = ({
  donation,
  reportedUserId,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  
  
  const {
    showToast
  } = useNotifications();
  const [reason, setReason] = useState('inappropriate behavior');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/reviews/report', {
        reportedUserId,
        donationId: donation._id || donation.id,
        moduleType: donation.moduleType || (donation.foodName ? 'food' : 'cloth'),
        reason,
        description
      });
      showToast('toastTitle_success', 'toastMsg_reportSubmittedSuccessfullyThankYou');
      onClose();
    } catch (err) {
      showToast('toastTitle_errorErrResponseDataMessageFailedToSubmitReport', 'toastMsg_error');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{t("Report User")}</h3>
          <p className="text-sm text-slate-500 mt-1">{t("This report is confidential and goes directly to the Trust & Safety team.")}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t("Reason for report")}</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
              <option value="inappropriate behavior">{t("Inappropriate Behavior")}</option>
              <option value="fake donation">{t("Fake Donation")}</option>
              <option value="unsafe food">{t("Unsafe Food / Hazards")}</option>
              <option value="misleading listing">{t("Misleading Listing")}</option>
              <option value="abuse">{t("Harassment or Abuse")}</option>
              <option value="other">{t("Other")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{t("Description")}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("Please provide specific details...")} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none h-32" maxLength={1000} />
          </div>

          <div className="pt-2">
            <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
              {t("Submit Report")}
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Star, ShieldAlert } from 'lucide-react';
import { Button } from './ui';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
export const ReviewForm = ({
  donation,
  isDonor,
  onReviewComplete,
  onReport
}) => {
  const { t, i18n } = useTranslation();
  
  
  const {
    showToast
  } = useNotifications();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optional categories
  const [categories, setCategories] = useState({
    communication: 0,
    punctuality: 0,
    reliability: 0,
    experience: 0
  });
  const handleSubmit = async () => {
    if (rating === 0) {
      return showToast('toastTitle_error', 'toastMsg_pleaseProvideAStarRating');
    }
    const selectedCategories = Object.fromEntries(
      Object.entries(categories).filter(([, score]) => score > 0)
    );
    try {
      setIsSubmitting(true);
      await api.post('/reviews/submit', {
        donationId: donation._id || donation.id,
        moduleType: donation.moduleType || (donation.foodName ? 'food' : 'cloth'),
        revieweeId: isDonor ? (donation.acceptedReceiver?._id || donation.acceptedReceiver) : (donation.donor?._id || donation.donor),
        rating,
        categories: selectedCategories,
        comment
      });
      showToast('toastTitle_success', 'toastMsg_thankYouForYourReview');
      if (onReviewComplete) onReviewComplete();
    } catch (err) {
      showToast('Error', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  const updateCategory = (cat, val) => {
    setCategories(prev => ({
      ...prev,
      [cat]: val
    }));
  };
  return <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-lg mx-auto mt-6">
      <h3 className="text-xl font-black text-slate-900 mb-2 text-center">{isDonor ? t("Rate Receiver") : t("Rate Donor")}</h3>
      <p className="text-sm text-slate-500 text-center mb-8">
        {t("Your feedback builds trust in the community.")}
      </p>

      {/* Main Rating */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map(star => <button key={star} type="button" className="focus:outline-none transition-transform hover:scale-110" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
            <Star className={`w-10 h-10 ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          </button>)}
      </div>

      {/* Categories */}
      {rating > 0 && <div className="space-y-4 mb-8 animate-fadeIn">
          {['Communication', 'Punctuality', 'Reliability', 'Experience'].map(cat => {
        const key = cat.toLowerCase();
        return <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">{cat}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => updateCategory(key, star)} className="focus:outline-none">
                      <Star className={`w-5 h-5 ${star <= categories[key] ? 'fill-indigo-500 text-indigo-500' : 'text-slate-200'}`} />
                    </button>)}
                </div>
              </div>;
      })}
        </div>}

      {/* Comment */}
      <div className="mb-6">
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t("Leave a comment (optional)...")} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24" maxLength={500} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting} isLoading={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3">
          {t("Submit Review")}
        </Button>
        <button onClick={onReport} className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition">
          <ShieldAlert className="w-3.5 h-3.5" /> {t("Report suspicious behavior")}
        </button>
      </div>
    </div>;
};
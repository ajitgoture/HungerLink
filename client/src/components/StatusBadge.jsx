import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();

  const getBadgeStyle = (st) => {
    switch (st) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REQUESTED':
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'READY_FOR_PICKUP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'READY_FOR_DELIVERY':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'QR_VERIFIED':
      case 'COMPLETED':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'REJECTED':
      case 'NOT_SELECTED':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'EXPIRED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTranslatedText = (st) => {
    if (!st) return 'UNKNOWN';
    return t(`status.${st}`, st.replace(/_/g, ' '));
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(status)} uppercase tracking-wider`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {getTranslatedText(status)}
    </span>
  );
};

export default StatusBadge;

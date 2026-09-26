import { useTranslation } from "react-i18next";
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error loading this data. Please try again.',
  onRetry,
  className = ''
}) {
  const {
    t
  } = useTranslation();
  return <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-red-50/50 rounded-2xl border border-red-100 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && <Button variant="outline" onClick={onRetry}>
          {t("Try Again")}
        </Button>}
    </div>;
}
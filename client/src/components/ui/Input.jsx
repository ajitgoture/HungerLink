import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export const Input = forwardRef(({ className = '', error, label, id, ...props }, ref) => {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'} rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-slate-400 ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error ? t(error) : ""}</p>}
    </div>
  );
});
Input.displayName = 'Input';

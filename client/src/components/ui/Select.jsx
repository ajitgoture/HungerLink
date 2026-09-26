import { useTranslation } from "react-i18next";
import React, { forwardRef } from 'react';
export const Select = forwardRef(({
  className = '',
  error,
  label,
  id,
  options = [],
  ...props
}, ref) => {
  const { t } = useTranslation();
  return <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>}
      <select id={id} ref={ref} className={`w-full px-4 py-2.5 bg-white border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'} rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat ${className}`} {...props}>
        <option value="" disabled hidden>{t("Select an option")}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>)}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error ? t(error) : ""}</p>}
    </div>;
});
Select.displayName = 'Select';
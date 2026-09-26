import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }) {
  return <div className={`p-5 sm:p-6 border-b border-slate-50 ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
  return <h3 className={`text-lg font-bold text-slate-900 ${className}`}>{children}</h3>;
}

export function CardContent({ className = '', children }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return <div className={`p-5 sm:p-6 bg-slate-50 border-t border-slate-100 ${className}`}>{children}</div>;
}

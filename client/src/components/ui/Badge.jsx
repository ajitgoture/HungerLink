import React from 'react';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-orange-100 text-orange-800',
  destructive: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  food: 'bg-amber-100 text-amber-800',
  cloth: 'bg-indigo-100 text-indigo-800',
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const getVariant = (s) => {
    switch (s) {
      case 'AVAILABLE': return 'success';
      case 'REQUESTED': return 'warning';
      case 'ACCEPTED': return 'info';
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 'info';
      case 'COMPLETED':
      case 'RECEIVED': return 'success';
      case 'EXPIRED': return 'destructive';
      default: return 'default';
    }
  };
  
  return <Badge variant={getVariant(status)} className={className}>{status.replace(/_/g, ' ')}</Badge>;
}

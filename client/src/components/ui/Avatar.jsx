import React from 'react';

export function Avatar({ src, alt = "Avatar", size = "md", fallback, className = "" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl"
  };

  const Initials = fallback || alt.charAt(0).toUpperCase() || '?';

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden bg-slate-200 rounded-full shrink-0 ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-slate-600">{Initials}</span>
      )}
    </div>
  );
}

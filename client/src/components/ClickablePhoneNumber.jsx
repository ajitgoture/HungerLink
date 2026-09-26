import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone } from 'lucide-react';

const ClickablePhoneNumber = ({ 
  phone, 
  className = "", 
  iconClassName = "w-4 h-4", 
  textClassName = "font-bold hover:underline",
  showIcon = false
}) => {
  const { t } = useTranslation();

  const isInvalid = !phone || typeof phone === 'undefined' || phone === 'undefined' || phone === 'null' || phone === null;

  if (isInvalid) {
    return (
      <span className={`text-slate-400 italic ${className}`}>
        {showIcon && <Phone className={iconClassName} />}
        <span className="ml-1">{t('Phone unavailable')}</span>
      </span>
    );
  }

  let cleanPhone = "";
  let displayPhone = phone;

  try {
    const phoneStr = String(phone);
    cleanPhone = phoneStr.replace(/[^\d+]/g, '');
    displayPhone = phoneStr;
  } catch (e) {
    cleanPhone = "";
    displayPhone = "Unknown";
  }

  return (
    <a 
      href={`tel:${cleanPhone}`} 
      className={`flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80 ${className}`}
      aria-label={`Call ${displayPhone}`}
      onClick={(e) => {
        // Just let it behave normally as a link
        e.stopPropagation();
      }}
    >
      {showIcon && <Phone className={iconClassName} />}
      <span className={textClassName}>{displayPhone}</span>
    </a>
  );
};

export default ClickablePhoneNumber;

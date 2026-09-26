import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: "English", native: 'English' },
  { code: 'kn', label: "Kannada", native: 'ಕನ್ನಡ' },
  { code: 'hi', label: "Hindi", native: 'हिन्दी' },
  { code: 'ml', label: "Malayalam", native: 'മലയാളം' },
  { code: 'mr', label: "Marathi", native: 'मराठी' },
  { code: 'ta', label: "Tamil", native: 'தமிழ்' },
  { code: 'te', label: "Telugu", native: 'తెలుగు' },
];

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition border border-slate-200/80 cursor-pointer"
        title={t('title_changeLanguage')}
      >
        <Globe className="w-4 h-4 text-teal-600" />
        <span className="font-semibold">{currentLang.native}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t("Select Language")}
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-3 py-2 text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                i18n.language === lang.code
                  ? 'bg-teal-50 text-teal-700 font-black'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{lang.native}</span>
              <span className="text-[10px] text-slate-400 font-normal">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

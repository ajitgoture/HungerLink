import { useTranslation } from "react-i18next";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, User } from 'lucide-react';
import { Button } from './ui';
export const ProfileQRCodeModal = ({
  user,
  onClose
}) => {
  const {
    t
  } = useTranslation();
  if (!user) return null;

  // The URL that someone scanning the QR will be directed to
  const profileUrl = `${window.location.origin}/profile/${user._id}`;
  return <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col items-center p-8 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
        <p className="text-sm text-slate-500 mb-8">{user.role}</p>

        <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-100 mb-4">
          <QRCodeSVG value={profileUrl} size={200} level="H" includeMargin={false} />
        </div>
        
        {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs text-center max-w-[260px]">
            <p className="font-bold mb-1">{t("Testing on mobile?")}</p>
            <p>{t("Access your app using your computer's local IP (e.g.,")} <strong>192.168.x.x</strong>){t(") instead of")} <strong>localhost</strong> {t("so the QR code can be scanned across devices.")}</p>
          </div>
        ) : (
          <p className="text-xs text-center text-slate-400 mt-2 max-w-[200px]">
            {t("Scan this QR code to view public profile and statistics.")}
          </p>
        )}
      </div>
    </div>;
};
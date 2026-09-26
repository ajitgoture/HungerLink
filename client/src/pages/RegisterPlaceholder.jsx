import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
const RegisterPlaceholder = () => {
  const {
    t
  } = useTranslation();
  const [role, setRole] = useState('donor');
  return <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t("Create Your Account")}</h1>
          <p className="text-xs text-slate-500">{t("Join HungerLink as a Donor or Receiver")}</p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button type="button" onClick={() => setRole('donor')} className={`py-2.5 rounded-xl font-bold text-xs transition-all ${role === 'donor' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            {t("🤝 I Want to Donate")}
          </button>
          <button type="button" onClick={() => setRole('receiver')} className={`py-2.5 rounded-xl font-bold text-xs transition-all ${role === 'receiver' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            {t("🙏 I Need Help")}
          </button>
        </div>

        <form onSubmit={e => e.preventDefault()} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Full Name")}</label>
              <input type="text" placeholder={t("John Doe")} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Phone Number")}</label>
              <input type="tel" placeholder="+1 234 567 890" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("Email Address")}</label>
            <input type="email" placeholder={t("name@example.com")} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("City")}</label>
            <input type="text" placeholder={t("e.g. New York, London, Mumbai")} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("Password")}</label>
            <input type="password" placeholder={t("At least 6 characters")} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>

          <button type="submit" className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md hover:shadow-lg transition-all text-sm mt-2">
            {t("Register as")} {role === 'donor' ? 'Food/Clothes Donor' : 'Receiver'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-500 pt-2">
          {t("Already registered?")}{' '}
          <Link to="/login" className="text-teal-600 font-bold hover:underline">
            {t("Log In")}
          </Link>
        </p>

        <div className="text-center pt-1">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {t("Back to Home Page")}
          </Link>
        </div>

      </div>
    </div>;
};
export default RegisterPlaceholder;
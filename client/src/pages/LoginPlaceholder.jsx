import { useTranslation } from "react-i18next";
import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, ArrowLeft, Mail, Lock, Sparkles } from 'lucide-react';
const LoginPlaceholder = () => {
  const {
    t
  } = useTranslation();
  return <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t("Log In to HungerLink")}</h1>
          <p className="text-xs text-slate-500">{t("Access your Donor or Receiver Dashboard")}</p>
        </div>

        <form onSubmit={e => e.preventDefault()} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("Email Address")}</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" placeholder={t("donor@example.com")} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("Password")}</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md hover:shadow-lg transition-all text-sm">
            {t("Log In")}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-medium text-slate-400">{t("Or continue with")}</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button type="button" className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {t("Google Sign-In")}
        </button>

        <p className="text-xs text-center text-slate-500 pt-2">
          {t("Don't have an account?")}{' '}
          <Link to="/register" className="text-teal-600 font-bold hover:underline">
            {t("Sign Up")}
          </Link>
        </p>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {t("Back to Home Page")}
          </Link>
        </div>

      </div>
    </div>;
};
export default LoginPlaceholder;
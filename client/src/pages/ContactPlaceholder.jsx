import { useTranslation } from "react-i18next";
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowLeft, Send } from 'lucide-react';
const ContactPlaceholder = () => {
  const {
    t
  } = useTranslation();
  return <div className="min-h-[85vh] bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900">{t("Contact Support")}</h1>
          <p className="text-sm text-slate-500">{t("Have questions about HungerLink? We are here to help!")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <Mail className="w-6 h-6 text-teal-600 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">{t("Email")}</h4>
            <p className="text-xs text-slate-500">{t("support@hungerlink.org")}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <Phone className="w-6 h-6 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">{t("Phone")}</h4>
            <p className="text-xs text-slate-500">{t("+1 (800) 555-DONATE")}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <MapPin className="w-6 h-6 text-rose-600 mx-auto" />
            <h4 className="font-bold text-xs text-slate-900">{t("Location")}</h4>
            <p className="text-xs text-slate-500">{t("Global / Community Driven")}</p>
          </div>
        </div>

        <form onSubmit={e => e.preventDefault()} className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Your Name")}</label>
              <input type="text" placeholder={t("Jane Smith")} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t("Your Email")}</label>
              <input type="email" placeholder={t("jane@example.com")} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t("Message")}</label>
            <textarea rows="4" placeholder={t("How can we assist you?")} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"></textarea>
          </div>

          <button type="submit" className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {t("Send Message")}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {t("Back to Home Page")}
          </Link>
        </div>

      </div>
    </div>;
};
export default ContactPlaceholder;
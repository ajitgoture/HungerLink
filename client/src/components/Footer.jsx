import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HandHeart, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const Footer = () => {
  const {
    t
  } = useTranslation();
  const location = useLocation();

  // Hide footer on map/explore pages to maximize screen space for content
  const hiddenRoutes = ['/explore', '/food/available', '/cloth/available', '/food/map', '/cloth/map'];
  if (hiddenRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }
  return <footer className="bg-slate-900 border-t border-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <HandHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                {t("Hunger")}<span className="text-emerald-500">{t("Link")}</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {t("Bridging the gap between surplus and scarcity. Connecting compassionate donors with communities in need.")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t("Quick Links")}</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/food" className="hover:text-emerald-400 transition-colors">{t("Food Donation")}</Link></li>
              <li><Link to="/cloth" className="hover:text-emerald-400 transition-colors">{t("Clothes Donation")}</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">{t("Sign In")}</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">{t("Create Account")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t("Contact Us")}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-slate-400">{t("123 Charity Lane, Mumbai, Maharashtra, India")}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-400">{t("support@hungerlink.org")}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t("Legal")}</h3>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t("Privacy Policy")}</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">{t("Terms of Service")}</a></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {t("HungerLink. All rights reserved.")}</p>
        </div>
      </div>
    </footer>;
};
export default Footer;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HandHeart, Sparkles, UserCheck, UserPlus, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/routeUtils';
import { Button, Avatar } from './ui';
import NotificationDropdown from './NotificationDropdown';
import LanguageSelector from './LanguageSelector';
import { ProfileQRCodeModal } from './ProfileQRCodeModal';
const Navbar = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const navigate = useNavigate();
  const {
    user,
    logout
  } = useAuth();
  const {
    t
  } = useTranslation();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
              <HandHeart className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  {t("Hunger")}<span className="text-teal-600">{t("Link")}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-teal-500 animate-pulse" /> {t("Live")}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500 tracking-wide">
                {t('nav.tagline')}
              </span>
            </div>
          </Link>

          {/* Minimal Header Actions */}
          <div className="flex items-center gap-3">
            <LanguageSelector />

            {user ? <div className="flex items-center gap-3">
                {user.role === 'admin' && <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="hidden sm:flex gap-1.5 rounded-full border-indigo-200 bg-indigo-50 text-indigo-800">
                    <ShieldCheck className="w-4 h-4" />
                    {t("Admin")}
                  </Button>}
                
                <Button variant="outline" size="sm" onClick={() => navigate(getDashboardRoute(user.role))} className="hidden sm:flex gap-1.5 rounded-full border-emerald-200 bg-emerald-50 text-emerald-800">
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Button>

                <NotificationDropdown />

                <div className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-full md:pr-3 pl-1 py-1 hover:bg-slate-100 transition-colors" onClick={() => navigate('/profile')} title={t("View Profile")}>
                  <Avatar size="sm" alt={user.name} />
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-none">{user.name}</span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600 hover:bg-red-50" title={t('nav.logout')}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div> : <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  <UserCheck className="w-4 h-4 mr-1.5" /> {t('nav.login')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  <UserPlus className="w-4 h-4 mr-1.5" /> {t('nav.signup')}
                </Button>
              </div>}
          </div>

        </div>
      </div>
      {showQRModal && <ProfileQRCodeModal user={user} onClose={() => setShowQRModal(false)} />}
    </header>;
};
export default Navbar;
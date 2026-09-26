import { useTranslation } from "react-i18next";
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Compass, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const MobileBottomNav = () => {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  if (!user) return null;
  return <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <NavLink to="/explore" className={({
        isActive
      }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}>
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-bold">{t("Explore")}</span>
        </NavLink>

        <NavLink to="/dashboard" className={({
        isActive
      }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">{t("Dashboard")}</span>
        </NavLink>

        {/* Floating Action Button for Donate */}
        <div className="relative -top-5 flex justify-center w-full">
          <NavLink to={user?.role?.includes('Cloth') ? "/cloth/donate" : "/food/donate"} className="flex items-center justify-center w-14 h-14 bg-teal-500 rounded-full text-white shadow-lg shadow-teal-500/30 hover:bg-teal-400 hover:scale-105 transition-all">
            <PlusCircle className="w-8 h-8" />
          </NavLink>
        </div>

        <NavLink to="/impact" className={({
        isActive
      }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}>
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold">{t("Impact")}</span>
        </NavLink>

        <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} className={({
        isActive
      }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${user.role === 'admin' && isActive ? 'text-indigo-600' : isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}>
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">{user.role === 'admin' ? 'Admin' : 'Settings'}</span>
        </NavLink>
      </div>
    </div>;
};
export default MobileBottomNav;
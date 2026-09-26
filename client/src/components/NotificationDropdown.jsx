import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
const NotificationDropdown = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAllRead
  } = useNotifications();
  return <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none" aria-label={t("Notifications")}>
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>}
      </button>

      {isOpen && <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">{t("Notifications")}</h4>
              {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                  {unreadCount} {t("New")}
                </span>}
            </div>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> {t("Mark All Read")}
              </button>}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? <div className="py-8 text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs font-medium">{t("No notifications yet")}</p>
              </div> : notifications.map(notif => <div key={notif._id} className={`p-4 transition-colors ${notif.isRead ? 'bg-white' : 'bg-teal-50/40 font-medium'}`}>
                  <h5 className="text-xs font-bold text-slate-900">
                    {notif.titleCode ? t(notif.titleCode, notif.messageParams || {}) : t(notif.title)}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.messageCode ? t(notif.messageCode, notif.messageParams || {}) : t(notif.message)}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(notif.createdAt).toLocaleTimeString(i18n.language, [], {
              hour: '2-digit',
              minute: '2-digit'
            })}
                  </span>
                </div>)}
          </div>
        </div>}
    </div>;
};
export default NotificationDropdown;
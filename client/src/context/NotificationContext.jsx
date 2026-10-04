import { useTranslation } from 'react-i18next';
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { socket } from '../services/socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastAlert, setToastAlert] = useState(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  const showToast = (title, message) => {
    setToastAlert({ title, message, id: Date.now() });
    setTimeout(() => setToastAlert(null), 5000);

    // Fire actual browser Push Notification if granted and app is not focused
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification(title, {
        body: message,
        icon: '/favicon.svg'
      });
    }
  };

  // System-Wide Real-Time Socket.IO Notification Listeners
  useEffect(() => {
    if (!user) return;

    const handleGenericNotification = (notif) => {
      if (notif) {
        showToast(notif.titleCode || notif.title || 'Notification', notif.messageCode || notif.message);
        fetchNotifications();
      }
    };

    const handleNewFoodRequest = (data) => {
      showToast('toastTitle_newRequestReceived', data.notification?.message || t('toastMsg_yourFoodDonationReceivedARequest'));
      fetchNotifications();
    };

    const handleNewClothRequest = (data) => {
      showToast('toastTitle_newRequestReceived', data.notification?.message || t('toastMsg_yourClothesDonationReceivedARequest'));
      fetchNotifications();
    };

    const handleAccepted = (data) => {
      showToast('toastTitle_requestAccepted', data.notification?.message || t('toastMsg_yourRequestHasBeenAccepted'));
      fetchNotifications();
    };

    const handleNotSelected = (data) => {
      showToast('toastTitle_statusUpdate', data.notification?.message || t('toastMsg_anotherReceiverHasBeenSelected'));
      fetchNotifications();
    };

    const handleRejected = (data) => {
      showToast('toastTitle_requestUpdate', data.notification?.message || t('toastMsg_yourRequestWasNotAccepted'));
      fetchNotifications();
    };

    const handleTransferSet = (data) => {
      fetchNotifications();
    };

    const handleCompleted = (data) => {
      showToast('toastTitle_donationCompleted', data.notification?.message || t('toastMsg_donationCompletedSuccessfully'));
      fetchNotifications();
    };

    // Attach Socket.IO Listeners
    socket.on('notification:new', handleGenericNotification);
    socket.on('FOOD_REQUESTED', handleNewFoodRequest);
    socket.on('CLOTH_REQUESTED', handleNewClothRequest);
    socket.on('REQUEST_ACCEPTED', handleAccepted);
    socket.on('CLOTH_REQUEST_ACCEPTED', handleAccepted);
    socket.on('FALLBACK_ACCEPTED', handleAccepted);
    socket.on('CLOTH_FALLBACK_ACCEPTED', handleAccepted);
    socket.on('REQUEST_NOT_SELECTED', handleNotSelected);
    socket.on('CLOTH_REQUEST_NOT_SELECTED', handleNotSelected);
    socket.on('REQUEST_REJECTED', handleRejected);
    socket.on('CLOTH_REQUEST_REJECTED', handleRejected);
    socket.on('TRANSFER_METHOD_SET', handleTransferSet);
    socket.on('CLOTH_TRANSFER_METHOD_SET', handleTransferSet);
    socket.on('TRANSFER_UPDATE', handleTransferSet);
    socket.on('DONATION_COMPLETED', handleCompleted);
    socket.on('CLOTH_DONATION_COMPLETED', handleCompleted);

    return () => {
      socket.off('notification:new', handleGenericNotification);
      socket.off('FOOD_REQUESTED', handleNewFoodRequest);
      socket.off('CLOTH_REQUESTED', handleNewClothRequest);
      socket.off('REQUEST_ACCEPTED', handleAccepted);
      socket.off('CLOTH_REQUEST_ACCEPTED', handleAccepted);
      socket.off('FALLBACK_ACCEPTED', handleAccepted);
      socket.off('CLOTH_FALLBACK_ACCEPTED', handleAccepted);
      socket.off('REQUEST_NOT_SELECTED', handleNotSelected);
      socket.off('CLOTH_REQUEST_NOT_SELECTED', handleNotSelected);
      socket.off('REQUEST_REJECTED', handleRejected);
      socket.off('CLOTH_REQUEST_REJECTED', handleRejected);
      socket.off('TRANSFER_METHOD_SET', handleTransferSet);
      socket.off('CLOTH_TRANSFER_METHOD_SET', handleTransferSet);
      socket.off('TRANSFER_UPDATE', handleTransferSet);
      socket.off('DONATION_COMPLETED', handleCompleted);
      socket.off('CLOTH_DONATION_COMPLETED', handleCompleted);
    };
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, fetchNotifications, toastAlert, showToast }}
    >
      {children}
      {/* Real-time Floating Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/50 flex items-start gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
            🔔
          </div>
          <div>
            <h4 className="font-bold text-sm text-teal-300">{t(toastAlert.title)}</h4>
            <p className="text-xs text-slate-200 mt-0.5">{t(toastAlert.message)}</p>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

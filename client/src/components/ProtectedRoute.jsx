import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from './ui';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    // 401 Unauthenticated -> Redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // 403 Unauthorized -> Render Access Denied instead of silently redirecting to home
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-100">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t("Access Denied")}</h2>
          <p className="text-slate-600 mb-6">{t('You do not have permission to view this page. This area requires')} <b>{allowedRoles.join(' or ')}</b> {t('privileges.')}</p>
          <Link to="/">
            <Button className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('Return to Home')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

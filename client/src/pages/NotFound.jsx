import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-100">
        <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-slate-900 mb-2">404</h2>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{t("Page Not Found")}</h3>
        <p className="text-slate-600 mb-6">{t("The page you are looking for doesn't exist or has been moved.")}</p>
        <Link to="/">
          <Button className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" /> {t('Return to Home')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

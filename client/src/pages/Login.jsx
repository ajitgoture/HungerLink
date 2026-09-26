import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/routeUtils';
import { Button, Input } from '../components/ui';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    t
  } = useTranslation();
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      setSubmitting(true);
      const user = await login(email, password);
      const from = location.state?.from;
      if (from) {
        navigate(from);
      } else {
        navigate(getDashboardRoute(user.role));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t('auth.login_title')}</h1>
          <p className="text-xs text-slate-500">{t('auth.login_subtitle')}</p>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error ? t(error) : ""}</span>
          </div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('auth.email_label')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("user@example.com")} required />

          <Input label={t('auth.password_label')} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

          <Button type="submit" disabled={submitting} isLoading={submitting} className="w-full mt-2">
            {submitting ? t('auth.authenticating') : t('auth.login_btn')}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-500 pt-2">
          {t('auth.no_account')}{' '}
          <Link to="/register" state={location.state} className="text-teal-600 font-bold hover:underline">
            {t('auth.signup_now')}
          </Link>
        </p>

        <div className="text-center pt-1">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {t('auth.back_home')}
          </Link>
        </div>

      </div>
    </div>;
};
export default Login;
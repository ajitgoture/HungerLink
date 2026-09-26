import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/routeUtils';
import { validatePassword, validatePhone } from '../utils/validation';
import { Button, Input, Select, Textarea } from '../components/ui';
const Register = () => {
  const {
    t
  } = useTranslation();
  const location = useLocation();
  const [role, setRole] = useState(location.state?.role || 'Food Donor');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    register
  } = useAuth();
  const navigate = useNavigate();
  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const isPasswordValid = validatePassword(formData.password);
  const isPhoneValid = validatePhone(formData.phone) || formData.phone === '';
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.city) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet the minimum security requirements.');
      return;
    }
    if (!isPhoneValid && formData.phone !== '') {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    try {
      setSubmitting(true);
      await register({
        ...formData,
        role
      });
      const from = location.state?.from;
      if (from) {
        navigate(from);
      } else {
        navigate(getDashboardRoute(role));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t("Create an Account")}</h1>
          <p className="text-xs text-slate-500">{t("Join the HungerLink community today.")}</p>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error ? t(error) : ""}</span>
          </div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label={t("Full Name *")} name="name" value={formData.name} onChange={handleChange} placeholder={t("John Doe")} required />
            <Input label={t("Email Address *")} type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t("user@example.com")} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label={t("Phone Number *")} name="phone" value={formData.phone} onChange={handleChange} placeholder={t("e.g. 9876543210")} error={formData.phone && !isPhoneValid ? t('Invalid 10-digit number') : null} required />
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t("Account Type *")}
              </label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-semibold text-slate-700" required>
                <option value="Food Donor">{t("Food Donor")}</option>
                <option value="Food Receiver">{t("Food Receiver")}</option>
                <option value="Cloth Donor">{t("Cloth Donor")}</option>
                <option value="Cloth Receiver">{t("Cloth Receiver")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Input label={t("Password *")} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
              {formData.password && !isPasswordValid && <p className="text-xs text-red-500 mt-1">{t("Must be 8+ chars, with uppercase, lowercase, number, and special char.")}</p>}
            </div>
            <Input label={t("Confirm Password *")} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" error={formData.confirmPassword && formData.password !== formData.confirmPassword ? t('Passwords do not match') : null} required />
          </div>

          <div className="grid grid-cols-1 gap-5">
            <Input label={t("City *")} name="city" value={formData.city} onChange={handleChange} placeholder={t("e.g. Mumbai")} required />
            <Textarea label={t("Full Address (Optional)")} name="address" value={formData.address} onChange={handleChange} placeholder={t("Your complete address...")} rows={3} />
          </div>

          <Button type="submit" disabled={submitting} isLoading={submitting} className="w-full mt-4" size="lg">
            {submitting ? t('Creating Account...') : t('Create Account')}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-500 pt-2">
          {t("Already have an account?")}{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:underline">
            {t("Sign In")}
          </Link>
        </p>

        <div className="text-center pt-1">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {t("Back to Home")}
          </Link>
        </div>

      </div>
    </div>;
};
export default Register;
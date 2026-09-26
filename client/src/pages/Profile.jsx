import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Star, Trophy, ArrowLeft, Mail, Phone, ShieldCheck, Edit, QrCode } from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, Button, Avatar } from '../components/ui';
import { ProfileQRCodeModal } from '../components/ProfileQRCodeModal';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(false);
      const { data } = await api.get('/auth/me');
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-semibold">{t("Loading Profile...")}</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">{t("Unable to load profile.")}</h2>
        <Button onClick={fetchProfile}>{t("Retry")}</Button>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("Back")}
        </Button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
             <button 
                onClick={() => setShowQRModal(true)} 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-xl transition flex items-center gap-2 text-xs font-bold shadow-sm"
             >
               <QrCode className="w-4 h-4" />
               <span className="hidden sm:inline">{t("Show QR Code")}</span>
             </button>
          </div>
          
          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center -mt-12 mb-4 border-4 border-white">
              <User className="w-12 h-12 text-slate-300" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                  {profile.name}
                  {profile.isVerified && <ShieldCheck className="w-6 h-6 text-emerald-500" title={t("Verified")} />}
                </h1>
                <p className="text-sm text-slate-500 font-medium mb-1">@{profile.name.replace(/\s+/g, '').toLowerCase()}</p>
                <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                  {profile.role}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-slate-100 pt-8">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t("Contact Information")}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="font-medium break-all">{profile.email || t("Not Provided")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="font-medium">{profile.phone || t("Not Provided")}</span>
                  </div>
                </div>
              </div>

              {/* Location & Account */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t("Location & Account")}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="font-medium">{profile.city || t("Not Provided")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="font-medium">{t("Member Since")} {joinDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats (if applicable) */}
            {(profile.role?.includes('Donor') || profile.role?.includes('Receiver')) && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t("Community Impact")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="bg-amber-50 border-amber-100 shadow-none">
                    <CardContent className="p-4 text-center">
                      <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                      <div className="text-2xl font-black text-amber-700">{profile.stats?.averageRating?.toFixed(1) || '5.0'}</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{t("Rating")}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-emerald-50 border-emerald-100 shadow-none">
                    <CardContent className="p-4 text-center">
                      <Trophy className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <div className="text-2xl font-black text-emerald-700">{profile.stats?.completedTransfers || 0}</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("Completed")}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {showQRModal && <ProfileQRCodeModal user={profile} onClose={() => setShowQRModal(false)} />}
    </div>
  );
}

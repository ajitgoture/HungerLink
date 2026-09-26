import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, MapPin, Calendar, Star, Trophy, ArrowLeft, HeartHandshake, Utensils } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import { Card, CardContent, Button } from '../components/ui';
import { DonationCard } from '../components/DonationCard';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
export default function PublicProfile() {
  const { t, i18n } = useTranslation();
  
  
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    showToast
  } = useNotifications();
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const {
          data: profileData
        } = await api.get(`/auth/profile/${id}`);
        setProfile(profileData);
        if (profileData?.role?.includes('Donor')) {
          const {
            data: donationsData
          } = await api.get(`/food/donations/donor/${id}`);
          setDonations(donationsData);
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);
  const handleRequestClick = async donation => {
    if (!user) return navigate('/login');
    if (user.role.includes('Donor')) return showToast('toastTitle_roleRestriction', 'toastMsg_donorsCannotRequestItems');
    try {
      await api.post(`/food/requests`, {
        donationId: donation._id
      });
      setDonations(prev => prev.map(d => d._id === donation._id ? {
        ...d,
        requests: [{
          receiver: user._id
        }]
      } : d));
      showToast('toastTitle_success', 'toastMsg_requestSubmittedSuccessfully');
    } catch (err) {
      showToast('toastTitle_error', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_errorSubmittingRequest'));
    }
  };
  if (loading) {
    return <div className="p-12 text-center text-slate-500">{t("Loading profile...")}</div>;
  }
  if (!profile) {
    return <div className="p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900">{t("User not found")}</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>{t("Return Home")}</Button>
      </div>;
  }
  const joinDate = new Date(profile.createdAt).toLocaleDateString(i18n.language, );
  return <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("Back")}
        </Button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          
          <div className="px-8 pb-8 relative">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center -mt-12 mb-4 border-4 border-white">
              <User className="w-12 h-12 text-slate-300" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
            <p className="text-lg text-emerald-600 font-medium mb-6">{profile.role}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span>{profile.city}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span>{t("Joined")} {joinDate}</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">{t("Community Impact")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="p-4 text-center">
                  <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-amber-700">{profile.stats?.averageRating || 0}</div>
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">{t("Rating")}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-emerald-50 border-emerald-100">
                <CardContent className="p-4 text-center">
                  <Trophy className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-emerald-700">{profile.stats?.completedTransfers || 0}</div>
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{t("Completed")}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {profile.role.includes('Donor') && donations.length > 0 && <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-500" /> 
            {t("Donations by")} {profile.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map(donation => <DonationCard key={donation._id} item={donation} type="food" currentUserId={user?._id} onRequest={() => handleRequestClick(donation)} />)}
          </div>
        </div>}
    </div>;
}
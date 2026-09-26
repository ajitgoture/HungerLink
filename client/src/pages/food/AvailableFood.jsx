import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, Search, MapPin, HeartHandshake } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { calculateDistance } from '../../utils/distance';
import { Button, Input, Select, EmptyState, Skeleton } from '../../components/ui';
import { DonationCard } from '../../components/DonationCard';
const AvailableFood = () => {
  const { t, i18n } = useTranslation();
  
  
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [foodType, setFoodType] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [myRequestedIds, setMyRequestedIds] = useState(new Set());
  const {
    user
  } = useAuth();
  const {
    socket
  } = useSocket();
  const {
    showToast
  } = useNotifications();
  const navigate = useNavigate();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }), () => console.log('Location access not granted'));
    }
  }, []);
  const fetchAvailableDonations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (foodType !== 'ALL') params.foodType = foodType;
      if (cityFilter) params.city = cityFilter;
      if (search) params.search = search;
      if (userLocation) {
        params.userLat = userLocation.lat;
        params.userLng = userLocation.lng;
      }
      const {
        data
      } = await api.get('/food/donations/available', {
        params
      });
      setDonations(data || []);
      if (user && user.role === 'Food Receiver') {
        const reqRes = await api.get('/food/requests/receiver');
        const requestedDonationIds = new Set((reqRes.data || []).filter(r => ['PENDING', 'ACCEPTED'].includes(r.status)).map(r => r.donation?._id || r.donation));
        setMyRequestedIds(requestedDonationIds);
      }
    } catch (err) {
      console.error('Error loading available food:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAvailableDonations();
  }, [foodType, cityFilter, userLocation]);
  useEffect(() => {
    const handleNewDonation = newDonation => {
      setDonations(prev => [newDonation, ...prev]);
    };
    socket.on('NEW_FOOD_DONATION', handleNewDonation);
    return () => socket.off('NEW_FOOD_DONATION', handleNewDonation);
  }, [socket]);
  const handleRequestClick = donation => {
    if (!user) return navigate('/login');
    if (user.role === 'Food Donor') return showToast('toastTitle_roleRestriction', 'toastMsg_foodDonorsCannotRequestFood');
    if (myRequestedIds.has(donation._id)) return showToast('toastTitle_alreadyRequested', 'toastMsg_youAlreadyRequestedThisFood');
    setSelectedDonation(donation);
  };
  const confirmRequest = async () => {
    if (!selectedDonation) return;
    try {
      setRequesting(true);
      await api.post('/food/requests', {
        donationId: selectedDonation._id
      });
      setMyRequestedIds(prev => new Set([...prev, selectedDonation._id]));
      showToast('toastTitle_requestSubmitted', 'toastMsg_yourRequestHasBeenSubmittedSuccessfully');
      setSelectedDonation(null);
    } catch (err) {
      showToast('toastTitle_requestError', err.response?.data?.message ? t(err.response.data.message) : t('toastMsg_errorSubmittingRequest'));
    } finally {
      setRequesting(false);
    }
  };
  return <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {t("Live Available Donations")}
            </div>
            <h1 className="text-3xl font-black text-slate-900">{t("Available Food")}</h1>
            <p className="text-xs text-slate-500 mt-1">{t("Real-time feed of available meals in your city.")}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/food/map')} className="gap-2">
            <MapPin className="w-4 h-4" /> {t("View Map Explorer")}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder={t("Search by food name...")} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchAvailableDonations()} />
          <Select value={foodType} onChange={e => setFoodType(e.target.value)} options={[{
          value: 'ALL',
          label: t("All Food Types")
        }, {
          value: 'Vegetarian',
          label: t("Vegetarian")
        }, {
          value: 'Non-Vegetarian',
          label: t("Non-Vegetarian")
        }, {
          value: 'Mixed Food (Vegetarian and Non-Vegetarian)',
          label: t("Mixed Food")
        }]} />
          <Input placeholder={t("Filter by City (e.g. Mumbai)")} value={cityFilter} onChange={e => setCityFilter(e.target.value)} />
        </div>

        {/* List */}
        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
          </div> : donations.length === 0 ? <EmptyState icon={Utensils} title={t("No Food Donations Found")} description={t("There are currently no active food donations matching your filters.")} /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map(donation => {
          const itemWithMeta = {
            ...donation,
            distance: donation.distanceKm || (userLocation ? calculateDistance(userLocation.lat, userLocation.lng, donation.approximateLocation.lat, donation.approximateLocation.lng) : null)
          };
          itemWithMeta.requests = myRequestedIds.has(donation._id) ? [{
            receiver: user?._id
          }] : [];
          return <DonationCard key={donation._id} item={itemWithMeta} type="food" currentUserId={user?._id} onRequest={() => handleRequestClick(donation)} onManage={() => navigate('/food/donor-dashboard')} />;
        })}
          </div>}

        {/* Modal */}
        {selectedDonation && <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900">{t("Confirm Request")}</h3>
                <p className="text-sm text-slate-500 mt-2">
                  {t("Requesting \"")}{selectedDonation.foodName}" ({selectedDonation.quantity} {selectedDonation.unit})
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="w-full" onClick={() => setSelectedDonation(null)}>{t("Cancel")}</Button>
                <Button variant="primary" className="w-full bg-amber-500 hover:bg-amber-600" isLoading={requesting} onClick={confirmRequest}>
                  {t("Confirm Request")}
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default AvailableFood;
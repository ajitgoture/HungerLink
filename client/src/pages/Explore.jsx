import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Map as MapIcon, List, Filter, Utensils, Shirt, AlertCircle, Compass, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { Button, Input, Select, EmptyState, Skeleton, Badge } from '../components/ui';
import { DonationCard } from '../components/DonationCard';
import ExploreMap from '../components/ExploreMap'; // We will create this

const Explore = ({
  mode
}) => {
  const { t, i18n } = useTranslation();
  
  
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user
  } = useAuth();
  const {
    socket
  } = useSocket();
  const {
    showToast
  } = useNotifications();

  // Parse URL query for default tab
  const searchParams = new URLSearchParams(location.search);
  const initialTab = mode === 'food' ? 'food' : searchParams.get('tab') || 'food';
  const [activeTab, setActiveTab] = useState(initialTab); // 'food' or 'cloth'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(50); // 50km default
  const [sort, setSort] = useState('nearest');
  const [foodType, setFoodType] = useState('ALL');
  const [clothingCategory, setClothingCategory] = useState('ALL');
  const [size, setSize] = useState('ALL');
  const [condition, setCondition] = useState('ALL');
  const [season, setSeason] = useState('ALL');
  const [myRequestedIds, setMyRequestedIds] = useState(new Set());
  useEffect(() => {
    // Get user location for $geoNear queries
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      }, () => showToast('toastTitle_locationWarning', 'toastMsg_enableLocationForAccurateDistances'));
    }
  }, []);
  const fetchExploreData = async () => {
    try {
      setLoading(true);
      const params = {
        type: activeTab,
        sort
      };
      if (search) params.search = search;
      if (mode !== 'food') params.maxDistance = radius;
      if (userLocation) {
        params.userLat = userLocation.lat;
        params.userLng = userLocation.lng;
      }
      if (activeTab === 'food') {
        if (foodType !== 'ALL') params.foodType = foodType;
      } else {
        if (clothingCategory !== 'ALL') params.clothingCategory = clothingCategory;
        if (size !== 'ALL') params.size = size;
        if (condition !== 'ALL') params.condition = condition;
        if (season !== 'ALL') params.season = season;
      }
      const {
        data
      } = await api.get('/explore', {
        params
      });
      setDonations(data);
      if (user?.role.includes('Receiver')) {
        const reqRes = await api.get(`/${activeTab}/requests/receiver`);
        const requested = new Set((reqRes.data || []).filter(r => ['PENDING', 'ACCEPTED'].includes(r.status)).map(r => r.donation?._id || r.donation));
        setMyRequestedIds(requested);
      }
    } catch (err) {
      console.error(err);
      showToast('toastTitle_error', 'toastMsg_failedToFetchDonations');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // We only want to refetch when filters change or location is obtained
    fetchExploreData();
  }, [activeTab, search, radius, sort, foodType, clothingCategory, size, condition, season, userLocation]);
  useEffect(() => {
    if (!socket) return;
    const handleNewFood = donation => {
      if (activeTab === 'food') {
        setDonations(prev => [{
          ...donation,
          moduleType: 'food'
        }, ...prev]);
        showToast('toastTitle_newDonationDy', 'toastMsg_aNewFoodDonationDonationFoodnameWasJustPosted');
      }
    };
    const handleNewCloth = donation => {
      if (activeTab === 'cloth') {
        setDonations(prev => [{
          ...donation,
          moduleType: 'cloth'
        }, ...prev]);
        showToast('toastTitle_newDonationDy', 'toastMsg_newClothesDonationClothingtypeWereJustPosted');
      }
    };
    const handleAccepted = data => {
      // Remove or update the donation if accepted
      setDonations(prev => prev.filter(d => d._id !== data.donationId && d._id !== data.donation?._id));
    };
    socket.on('NEW_FOOD_DONATION', handleNewFood);
    socket.on('cloth:donation-created', handleNewCloth);
    socket.on('REQUEST_ACCEPTED', handleAccepted);
    socket.on('CLOTH_REQUEST_ACCEPTED', handleAccepted);
    return () => {
      socket.off('NEW_FOOD_DONATION', handleNewFood);
      socket.off('cloth:donation-created', handleNewCloth);
      socket.off('REQUEST_ACCEPTED', handleAccepted);
      socket.off('CLOTH_REQUEST_ACCEPTED', handleAccepted);
    };
  }, [socket, activeTab, showToast]);
  const handleRequestClick = async donation => {
    if (!user) return navigate('/login');
    if (user.role.includes('Donor')) return showToast('toastTitle_roleRestriction', 'toastMsg_donorsCannotRequestItems');
    if (myRequestedIds.has(donation._id)) return showToast('toastTitle_alreadyRequested', 'toastMsg_youAlreadyRequestedThis');
    try {
      await api.post(`/${activeTab}/requests`, {
        donationId: donation._id
      });
      setMyRequestedIds(prev => new Set([...prev, donation._id]));
      showToast('toastTitle_success', 'toastMsg_requestSubmittedSuccessfully');
    } catch (err) {
      showToast('toastTitle_error', err.response?.data?.message || t('toastMsg_errorSubmittingRequest'));
    }
  };
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const activeDonations = donations.filter(d => {
    if (activeTab === 'food' && d.expiryTime) {
       return new Date(d.expiryTime) > Date.now();
    }
    return true;
  });
  const urgentDonations = activeDonations.filter(d => {
    if (!d.expiryTime) return false;
    const hrs = (new Date(d.expiryTime) - new Date()) / (1000 * 60 * 60);
    return hrs > 0 && hrs < 3; // Expires in less than 3 hours
  });
  return <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Compass className="w-6 h-6 text-teal-500" /> {mode === 'food' ? 'Explore Available Food' : 'Explore Donations'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{mode === 'food' ? 'Discover nearby food available for pickup.' : 'Discover nearby food and clothing available for pickup.'}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {mode !== 'food' && <>
                  <div className="bg-slate-100 p-1 rounded-xl flex">
                    <button onClick={() => setActiveTab('food')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'food' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-800'}`}>
                      <Utensils className="w-4 h-4" /> {t("Food")}
                    </button>
                    <button onClick={() => setActiveTab('cloth')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'cloth' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                      <Shirt className="w-4 h-4" /> {t("Clothes")}
                    </button>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                </>}

              <div className="bg-slate-100 p-1 rounded-xl flex hidden md:flex">
                <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                  <List className="w-4 h-4" /> {t("List")}
                </button>
                <button onClick={() => setViewMode('map')} className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                  <MapIcon className="w-4 h-4" /> {t("Map")}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 relative">
            <Input icon={<Search className="w-4 h-4 text-slate-400" />} placeholder={`Search for ${activeTab === 'food' ? 'meals, ingredients...' : 'shirts, pants...'}`} value={search} onChange={e => setSearch(e.target.value)} className="flex-grow" />
            <Button variant="outline" className="gap-2 shrink-0 md:hidden" onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')}>
              {viewMode === 'list' ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />} {viewMode === 'list' ? 'Map' : 'List'}
            </Button>
            <Button variant={showFilters ? 'primary' : 'outline'} className="gap-2 shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" /> {t("Filters")}
            </Button>
          </div>

        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row relative">
        
        {/* Filters Sidebar */}
        <div className={`md:w-64 bg-white border-r border-slate-200 shrink-0 absolute md:static inset-y-0 left-0 z-30 transition-transform transform ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:block overflow-y-auto`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between md:hidden">
              <h3 className="font-bold text-slate-900">{t("Filters")}</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <Select label={t("Sort By")} value={sort} onChange={e => setSort(e.target.value)} options={[{
            value: 'nearest',
            label: t("Nearest First")
          }, {
            value: 'newest',
            label: t("Newest Post")
          }, {
            value: 'expires_soon',
            label: t("Expiring Soon")
          }, {
            value: 'urgency',
            label: t("Highest Urgency")
          }]} />
            
            {mode !== 'food' && <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">{t("Radius:")} {radius} {t("km")}</label>
                <input type="range" min="1" max="100" value={radius} onChange={e => setRadius(e.target.value)} className="w-full accent-teal-500" />
              </div>}

            {activeTab === 'food' ? <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400">{t("Food Filters")}</h4>
                <Select label={t("Dietary Preference")} value={foodType} onChange={e => setFoodType(e.target.value)} options={[{
              value: 'ALL',
              label: t("Any")
            }, {
              value: 'Vegetarian',
              label: t("Vegetarian")
            }, {
              value: 'Non-Vegetarian',
              label: t("Non-Vegetarian")
            }]} />
              </div> : <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400">{t("Clothes Filters")}</h4>
                <Select label={t("Category")} value={clothingCategory} onChange={e => setClothingCategory(e.target.value)} options={[{
              value: 'ALL',
              label: t("Any")
            }, {
              value: 'Men',
              label: t("Men")
            }, {
              value: 'Women',
              label: t("Women")
            }, {
              value: 'Children',
              label: t("Children")
            }, {
              value: 'Unisex',
              label: t("Unisex")
            }]} />
                <Select label={t("Size")} value={size} onChange={e => setSize(e.target.value)} options={[{
              value: 'ALL',
              label: t("Any")
            }, {
              value: 'XS',
              label: t("XS")
            }, {
              value: 'S',
              label: t("S")
            }, {
              value: 'M',
              label: t("M")
            }, {
              value: 'L',
              label: t("L")
            }, {
              value: 'XL',
              label: t("XL")
            }]} />
                <Select label={t("Condition")} value={condition} onChange={e => setCondition(e.target.value)} options={[{
              value: 'ALL',
              label: t("Any")
            }, {
              value: 'New',
              label: t("New")
            }, {
              value: 'Like New',
              label: t("Like New")
            }, {
              value: 'Good',
              label: t("Good")
            }, {
              value: 'Usable',
              label: t("Usable")
            }]} />
                <Select label={t("Season")} value={season} onChange={e => setSeason(e.target.value)} options={[{
              value: 'ALL',
              label: t("Any")
            }, {
              value: 'Summer',
              label: t("Summer")
            }, {
              value: 'Winter',
              label: t("Winter")
            }, {
              value: 'All Season',
              label: t("All Season")
            }]} />
              </div>}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow relative h-[calc(100vh-140px)] overflow-hidden">
          
          {viewMode === 'map' ? <div className="absolute inset-0">
              <ExploreMap donations={activeDonations} userLocation={userLocation} radius={radius} type={activeTab} onRequest={handleRequestClick} requestedIds={myRequestedIds} />
            </div> : <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50">
              
              {/* Urgent Section */}
              {!loading && urgentDonations.length > 0 && <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <h3 className="font-black text-orange-900 text-lg">{t("Urgent Near You (Expiring Soon)")}</h3>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                    {urgentDonations.map(d => <div key={d._id} className="min-w-[280px] snap-center">
                        <DonationCard item={{
                  ...d,
                  requests: myRequestedIds.has(d._id) ? [{
                    receiver: user?._id
                  }] : []
                }} type={activeTab} currentUserId={user?._id} onRequest={() => handleRequestClick(d)} />
                      </div>)}
                  </div>
                </div>}

              {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[360px] w-full rounded-2xl" />)}
                </div> : activeDonations.length === 0 ? <EmptyState icon={activeTab === 'food' ? Utensils : Shirt} title={t("No items found")} description={mode === 'food' ? "Try adjusting your filters or expanding your search." : "Try adjusting your filters or expanding the search radius."} /> : <div>
                  <p className="text-sm font-bold text-slate-500 mb-4">{activeDonations.length} {t("Results Found")}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeDonations.map(d => <DonationCard key={d._id} item={{
                ...d,
                requests: myRequestedIds.has(d._id) ? [{
                  receiver: user?._id
                }] : []
              }} type={activeTab} currentUserId={user?._id} onRequest={() => handleRequestClick(d)} onManage={() => navigate(`/${activeTab}/donor-dashboard`)} />)}
                  </div>
                </div>}
            </div>}
          
        </div>
      </div>
    </div>;
};
export default Explore;
import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, ArrowLeft, Search, Filter, MapPin } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
const clothPinIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});
const ClothMapExplorer = () => {
  const {
    t
  } = useTranslation();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const fetchMapDonations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (search) params.search = search;
      const {
        data
      } = await api.get('/cloth/donations/available', {
        params
      });
      setDonations(data || []);
    } catch (err) {
      console.error('Error loading map clothes:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMapDonations();
  }, [categoryFilter]);
  return <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold">
              {t("Clothes Map Explorer 🗺️")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Available Clothes Map")}</h1>
            <p className="text-xs text-slate-500">{t("Geographic exploration of active available clothes donations nearby.")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cloth/available" className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition">
              {t("List View")}
            </Link>
            <Link to="/cloth" className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition">
              <ArrowLeft className="w-4 h-4" /> {t("Clothes Main")}
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchMapDonations()} placeholder={t("Search map by clothing type...")} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>

          <div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white">
              <option value="ALL">{t("All Categories 👕")}</option>
              <option value="Men">{t("Men")}</option>
              <option value="Women">{t("Women")}</option>
              <option value="Children">{t("Children")}</option>
              <option value="Unisex">{t("Unisex")}</option>
            </select>
          </div>
        </div>

        {/* Leaflet Map */}
        <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative z-0">
          {loading ? <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
              {t("Loading interactive clothes map...")}
            </div> : <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} className="h-full w-full">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {donations.map(donation => {
            const loc = donation.approximateLocation;
            if (!loc || !loc.lat || !loc.lng) return null;
            if (loc.lat === 0 && loc.lng === 0) return null;
            return <Marker key={donation._id} position={[loc.lat, loc.lng]} icon={clothPinIcon}>
                    <Popup>
                      <div className="p-2 space-y-2 max-w-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            {donation.clothingCategory}
                          </span>
                          <StatusBadge status={donation.status} />
                        </div>
                        {donation.items && donation.items.length > 0 ? (
  <>
    <h4 className='font-black text-sm text-slate-900'>{donation.items.length} {t('Items Donation')}</h4>
    <p className='text-[11px] text-slate-600'>{t('Total Qty:')} {donation.items.reduce((acc, it) => acc + (parseInt(it.quantity)||1), 0)}</p>
  </>
) : (
  <>
    <h4 className='font-black text-sm text-slate-900'>{donation.clothingType}</h4>
    <p className='text-[11px] text-slate-600'>{t('Qty:')} {donation.quantity} • {t('Size:')} {donation.size} • {t('Condition:')} {donation.condition}</p>
  </>
)}
                        <p className="text-[11px] font-bold text-indigo-700">{t("City:")} {loc.city}</p>
                        <button onClick={() => navigate('/cloth/available')} className="w-full py-1.5 rounded-lg bg-violet-600 text-white font-bold text-xs shadow-xs">
                          {t("Request in Available List")}
                        </button>
                      </div>
                    </Popup>
                  </Marker>;
          })}
            </MapContainer>}
        </div>

      </div>
    </div>;
};
export default ClothMapExplorer;
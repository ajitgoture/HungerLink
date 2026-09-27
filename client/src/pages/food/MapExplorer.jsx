import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ArrowLeft, MapPin, Utensils, Filter } from 'lucide-react';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
const MapExplorer = () => {
  const {
    t
  } = useTranslation();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const {
          data
        } = await api.get('/food/donations/available');
        setDonations(data || []);
      } catch (err) {
        console.error('Error fetching map donations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);
  return <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
          <div>
            <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
              {t("Interactive Leaflet Map")}
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">{t("Food Location Explorer 🗺️")}</h1>
            <p className="text-xs text-slate-500">{t("Explore approximate locations of available food donations nearby.")}</p>
          </div>

          <Link to="/food/available" className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition">
            <ArrowLeft className="w-4 h-4" /> {t("Available Food List")}
          </Link>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xl overflow-hidden h-[70vh] relative z-0">
          {loading ? <div className="h-full flex items-center justify-center text-slate-400">{t("Loading map markers...")}</div> : <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} className="h-full w-full rounded-2xl">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {donations.map(donation => {
            const lat = donation.approximateLocation?.lat;
            const lng = donation.approximateLocation?.lng;
            // Skip markers with no coordinates, NYC placeholder, or 0,0
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
            if (lat === 40.7128 && lng === -74.006) return null;
            if (lat === 0 && lng === 0) return null;
            return <Marker key={donation._id} position={[lat, lng]}>
                    <Popup>
                      <div className="p-1 space-y-1 max-w-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {donation.foodType}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900">{donation.foodName}</h4>
                        <p className="text-xs text-slate-600">
                          {donation.quantity} {donation.unit} {t("• Serves ~")}{donation.peopleServed}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-bold">
                          📍 {donation.approximateLocation?.city}
                        </p>
                        <Link to="/food/available" className="mt-2 block text-center py-1.5 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700">
                          {t("Request Food →")}
                        </Link>
                      </div>
                    </Popup>
                  </Marker>;
          })}
            </MapContainer>}
        </div>

      </div>
    </div>;
};
export default MapExplorer;
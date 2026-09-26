import { useTranslation } from "react-i18next";
import React from 'react';
import { X, Phone, MapPin, Navigation, User, ExternalLink } from 'lucide-react';
import MapView from './MapView';
import ClickablePhoneNumber from './ClickablePhoneNumber';
import { useAuth } from '../context/AuthContext';
const ConnectedDetailsModal = ({
  isOpen,
  onClose,
  donation,
  donor,
  receiver,
  isDonorView
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!isOpen || !donation) return null;
  const targetPerson = isDonorView ? receiver : donor;
  const address = donation.preciseLocation?.address || donation.approximateLocation?.city;
  const lat = donation.preciseLocation?.lat || donation.approximateLocation?.lat;
  const lng = donation.preciseLocation?.lng || donation.approximateLocation?.lng;
  
    const isPlaceholder = lat === 40.7128 && lng === -74.006;
  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isPlaceholder;
  
  const userLat = user?.location?.coordinates?.[1];
  const userLng = user?.location?.coordinates?.[0];
  const hasUserCoords = typeof userLat === 'number' && typeof userLng === 'number';

  let googleMapsUrl = '';
  if (hasValidCoords) {
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (hasUserCoords) {
      googleMapsUrl += `&origin=${userLat},${userLng}`;
    }
  } else {
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    if (hasUserCoords) {
      googleMapsUrl += `&origin=${userLat},${userLng}`;
    }
  }
  return <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              {t("Connected Request")}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {t("Pickup & Contact Details")}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Info Card */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase">
                {isDonorView ? 'Accepted Receiver' : 'Food Donor'}
              </p>
              <h4 className="text-base font-extrabold text-slate-900">{targetPerson?.name || 'Authorized Contact'}</h4>
            </div>
          </div>

          <div className="pt-2 border-t border-teal-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center text-slate-700">
              <ClickablePhoneNumber 
                phone={donation.contactNumber || targetPerson?.phone} 
                showIcon={true}
                iconClassName="w-4 h-4 text-teal-600"
                textClassName="font-bold text-teal-700 hover:underline"
              />
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{donation.approximateLocation?.city}</span>
            </div>
          </div>
        </div>

        {/* Precise Pickup Address */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-600" />
            {t("Exact Pickup Location (Unlocked)")}
          </label>
          <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {address}
          </p>
        </div>

        {/* Map & Google Route Button */}
        <div className="space-y-2">
          <MapView lat={hasValidCoords ? lat : null} lng={hasValidCoords ? lng : null} title={donation.foodName} address={address} height="h-48" />
          
          <a 
            href={googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => {
              if (navigator.geolocation) {
                e.preventDefault();
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const freshLat = pos.coords.latitude;
                    const freshLng = pos.coords.longitude;
                    let freshUrl = hasValidCoords 
                      ? `https://www.google.com/maps/dir/?api=1&origin=${freshLat},${freshLng}&destination=${lat},${lng}`
                      : `https://www.google.com/maps/dir/?api=1&origin=${freshLat},${freshLng}&destination=${encodeURIComponent(address)}`;
                    window.open(freshUrl, '_blank', 'noopener,noreferrer');
                  },
                  (err) => {
                    // Fallback to the precomputed URL
                    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                  },
                  { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <Navigation className="w-4 h-4" /> {t("Open Navigation Route in Google Maps")} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="pt-2">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
            {t("Close Details")}
          </button>
        </div>

      </div>
    </div>;
};
export default ConnectedDetailsModal;
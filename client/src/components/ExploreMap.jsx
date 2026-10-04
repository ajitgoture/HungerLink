import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { MapPin, ShieldCheck, Clock } from 'lucide-react';

const customFoodIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3553/3553811.png',
  iconSize: [35, 35]
});
const customClothIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3159/3159614.png',
  iconSize: [35, 35]
});
const userIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  iconSize: [35, 35]
});

// Component to dynamically fit map to data bounds
const MapUpdater = ({ donorGroups, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
      
      const bounds = latLngBounds();
      let hasPoints = false;

      if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
        bounds.extend([userLocation.lat, userLocation.lng]);
        hasPoints = true;
      }

      donorGroups.forEach(group => {
        if (typeof group.lat === 'number' && typeof group.lng === 'number') {
          bounds.extend([group.lat, group.lng]);
          hasPoints = true;
        }
      });

      if (hasPoints) {
        if (donorGroups.length === 0 && userLocation) {
          // Only user location, set view explicitly
          map.setView([userLocation.lat, userLocation.lng], 13);
        } else {
          // Fit bounds to cover all markers with padding
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    }, 300); // 300ms delay ensures DOM is ready inside potential modals/hidden tabs

    return () => clearTimeout(timeout);
  }, [donorGroups, userLocation, map]);
  return null;
};

const ExploreMap = ({ donations, userLocation, type, onRequest, requestedIds }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const defaultCenter = [20.5937, 78.9629]; // India Center Default
  
  // Timer state to force re-evaluation of expiries every minute
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Group donations by donor and filter expired/unavailable
  const donorGroups = useMemo(() => {
    const groups = {};
    const now = new Date();

    donations.forEach(d => {
      // 1. Must be AVAILABLE
      if (d.status !== 'AVAILABLE') return;
      
      // 2. Must not be expired (Server check is primary, but frontend double check prevents stale rendering)
      if (type === 'food' && d.expiryTime) {
        if (new Date(d.expiryTime) <= now) return; 
      }

      const donorId = d.donor?._id || d.donor;
      const donorName = d.donor?.name || t('Anonymous Donor');
      const lat = d.approximateLocation?.lat;
      const lng = d.approximateLocation?.lng;
      
      // Must have valid coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      
      const key = `${donorId}_${lat}_${lng}`;
      if (!groups[key]) {
        groups[key] = {
          donorId,
          donorName,
          lat,
          lng,
          distanceKm: d.distanceKm,
          donations: []
        };
      }
      groups[key].donations.push(d);
    });
    return Object.values(groups);
  }, [donations, type, t, tick]); // re-evaluate when `tick` changes

  if (donorGroups.length === 0 && !userLocation) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500 font-bold">{t("No donor locations available")}</p>
      </div>
    );
  }

  return (
    <MapContainer 
      center={userLocation && typeof userLocation.lat === 'number' ? [userLocation.lat, userLocation.lng] : defaultCenter} 
      zoom={userLocation && typeof userLocation.lat === 'number' ? 13 : 5} 
      className="w-full h-full z-0"
    >
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />
      
      <MapUpdater donorGroups={donorGroups} userLocation={userLocation} />

      {userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>{t("You are here")}</Popup>
        </Marker>
      )}

      {donorGroups.map(group => {
        const icon = type === 'food' ? customFoodIcon : customClothIcon;
        return (
          <Marker key={`${group.donorId}_${group.lat}_${group.lng}`} position={[group.lat, group.lng]} icon={icon}>
            <Popup className="custom-popup" minWidth={220}>
              <div className="w-56 font-sans">
                <div 
                  className="flex items-center gap-1.5 mb-2 cursor-pointer hover:text-emerald-700 transition-colors" 
                  onClick={() => navigate(`/profile/${group.donorId}`)}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 truncate">
                    {group.donorName}
                  </h3>
                </div>
                
                {group.distanceKm && (
                  <p className="text-[10px] text-teal-700 font-bold mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> ~{group.distanceKm.toFixed(1)} {t("km away")}
                  </p>
                )}

                <div className="max-h-48 overflow-y-auto pr-1 mb-2 space-y-2">
                  {group.donations.map(d => {
                    let activeNames = [];
                    if (d.foodItems && d.foodItems.length > 0) {
                      const active = d.foodItems.filter(item => item.status === 'AVAILABLE');
                      if (active.length > 0) {
                        activeNames = active.map(item => `${item.foodName} (${item.quantity} ${item.unit})`);
                      } else {
                        return null; // All sub-items expired
                      }
                    } else {
                      activeNames = [`${type === 'food' ? d.foodName : d.title || d.clothingType} (${d.quantity} ${type === 'food' ? d.unit : t('items')})`];
                    }
                    
                    const isAlreadyRequested = requestedIds.has(d._id);
                    
                    return (
                      <div key={d._id} className="bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="flex flex-col gap-1 mb-1">
                          {activeNames.map((name, i) => (
                            <span key={i} className="text-xs font-semibold text-slate-800 truncate block" title={name}>
                              • {name}
                            </span>
                          ))}
                        </div>
                        {type === 'food' && d.availableFrom && (
                           <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                             <Clock className="w-3 h-3" /> {t("Pickup:")} {new Date(d.availableFrom).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        )}
                        {type === 'food' && d.expiryTime && (
                           <p className="text-[10px] text-rose-500 mb-1 flex items-center gap-1">
                             <Clock className="w-3 h-3" /> {t("Expires:")} {new Date(d.expiryTime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        )}
                        <div className="flex gap-1 mt-1.5">
                          <Button variant="outline" className="flex-1 h-6 text-[9px] px-1" onClick={() => navigate(`/${type}/donations/${d._id}`)}>
                            {t("Details")}
                          </Button>
                          <Button variant={isAlreadyRequested ? "secondary" : "primary"} className="flex-1 h-6 text-[9px] px-1" disabled={isAlreadyRequested} onClick={() => onRequest(d)}>
                            {isAlreadyRequested ? t('Requested') : t('Request Food')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};
export default ExploreMap;
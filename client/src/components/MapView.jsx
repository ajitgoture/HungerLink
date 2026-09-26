import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPinOff } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to fix sizing issues in modals and center map
const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
      if (position) {
        map.setView(position, 14);
      }
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [map, position]);
  return null;
};

const MapView = ({ lat, lng, title, address, height = 'h-64' }) => {
  const { t } = useTranslation();
  const [resolvedPos, setResolvedPos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoords = async () => {
      setLoading(true);
      // Check if coordinates are valid and not the New York placeholder
      const isPlaceholder = lat === 40.7128 && lng === -74.006;
      const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' &&
                             lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isPlaceholder;
      
      if (hasValidCoords) {
        setResolvedPos([lat, lng]);
        setLoading(false);
        return;
      }

      // If invalid or placeholder, but we have an address, try to geocode with Nominatim
      if (address) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            setResolvedPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          } else {
            setResolvedPos(null);
          }
        } catch (error) {
          console.error("Geocoding failed:", error);
          setResolvedPos(null);
        }
      } else {
        setResolvedPos(null);
      }
      setLoading(false);
    };

    fetchCoords();
  }, [lat, lng, address]);

  if (loading) {
    return (
      <div className={`${height} w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center`}>
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!resolvedPos) {
    return (
      <div className={`${height} w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center`}>
        <MapPinOff className="w-8 h-8 mb-2 text-slate-300" />
        <p className="text-sm font-bold text-slate-500">{t("Location unavailable")}</p>
        <p className="text-[10px] mt-1">{t("No valid coordinates or geocodable address provided.")}</p>
      </div>
    );
  }

  return (
    <div className={`${height} w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0`}>
      <MapContainer center={resolvedPos} zoom={14} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater position={resolvedPos} />
        <Marker position={resolvedPos}>
          <Popup>
            <div className="p-1 space-y-1">
              <p className="font-bold text-xs text-slate-900">{title || t('Food Location')}</p>
              {address && <p className="text-[11px] text-slate-600">{address}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;

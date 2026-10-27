import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
function MapClickHandler({
  setLocation
}) {
  useMapEvents({
    click(e) {
      setLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  });
  return null;
}
const LocationPicker = ({
  position,
  setPosition,
  onCurrentLocation
}) => {
  const {
    t
  } = useTranslation();
  const [currentPos, setCurrentPos] = useState(position || null);
  const [locMsg, setLocMsg] = useState('');
  useEffect(() => {
    if (position) {
      setCurrentPos(position);
    }
  }, [position]);
  const handleSelectPos = newPos => {
    setCurrentPos(newPos);
    setPosition(newPos);
    setLocMsg('');
  };
  const handleLocateUser = () => {
    if (!globalThis.isSecureContext) {
      setLocMsg('Precise location requires HTTPS or localhost. Open this app using a secure address, then allow location access.');
      return;
    }
    if (navigator.geolocation) {
      setLocMsg('Detecting your location...');
      navigator.geolocation.getCurrentPosition(pos => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        // Reject 0,0 coordinates
        if (newPos.lat === 0 && newPos.lng === 0) {
          setLocMsg('Invalid GPS coordinates. Please click the map to choose your location.');
          return;
        }
        handleSelectPos(newPos);
        if (onCurrentLocation) onCurrentLocation(newPos);
        setLocMsg('');
      }, err => {
        if (err.code === 1) setLocMsg('Location permission denied. Allow location access for this site in your browser settings, then try again.');
        else if (err.code === 2) setLocMsg('Location unavailable. Click on the map to choose your pickup location.');
        else setLocMsg('Location timed out. Click on the map to choose your pickup location.');
      }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
    } else {
      setLocMsg('Geolocation not supported. Click on the map to choose your pickup location.');
    }
  };
  // Default map center: India (not NYC!)
  const mapCenter = currentPos ? [currentPos.lat, currentPos.lng] : [20.5937, 78.9629];
  return <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-teal-600" />
          {t("Click Map to Select Pickup Location")}
        </label>
        <button type="button" onClick={handleLocateUser} className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition flex items-center gap-1 cursor-pointer">
          <Navigation className="w-3.5 h-3.5" /> {t("Use My Location")}
        </button>
      </div>

      {locMsg && <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          {locMsg}
        </div>}

      <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <MapContainer center={mapCenter} zoom={currentPos ? 15 : 5} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {currentPos && <Marker position={[currentPos.lat, currentPos.lng]} />}
          <MapClickHandler setLocation={handleSelectPos} />
        </MapContainer>
      </div>

      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between px-1">
        <span>{t("Selected Coordinates:")}</span>
        <span className="font-mono text-teal-700">
          {currentPos ? (currentPos.lat.toFixed(4) + ", " + currentPos.lng.toFixed(4)) : "No location selected yet"}
        </span>
      </div>
    </div>;
};
export default LocationPicker;
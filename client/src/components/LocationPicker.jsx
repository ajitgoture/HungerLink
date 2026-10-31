import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function MapClickHandler({ setLocation }) {
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

function SelectedLocationView({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
    }
  }, [map, position]);
  return null;
}

const LocationPicker = ({
  position,
  setPosition,
  onPositionSelected,
  onCurrentLocation,
  suggestedArea = ''
}) => {
  const { t } = useTranslation();
  const [currentPos, setCurrentPos] = useState(position || null);
  const [locMsg, setLocMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (position) {
      setCurrentPos(position);
    }
  }, [position]);

  const handleSelectPos = async (newPos) => {
    setCurrentPos(newPos);
    if (setPosition) setPosition(newPos);
    if (onPositionSelected) {
      try {
        await onPositionSelected(newPos);
      } catch (err) {
        console.error('Error in onPositionSelected:', err);
      }
    }
    if (onCurrentLocation) {
      try {
        await onCurrentLocation(newPos);
      } catch (err) {
        console.error('Error in onCurrentLocation:', err);
      }
    }
  };

  const handleSearch = async (queryToSearch) => {
    const query = (typeof queryToSearch === 'string' ? queryToSearch : searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setLocMsg(t('Searching location for: ') + `"${query}"...`);

    try {
      // 1. Direct query
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.length > 0) {
          const first = data[0];
          const newPos = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
          await handleSelectPos(newPos);
          setLocMsg('');
          setIsSearching(false);
          return;
        }
      }

      // 2. Retry with Belagavi / India context if not found
      const contextualQuery = `${query}, Belagavi, Karnataka, India`;
      const retryResp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(contextualQuery)}&addressdetails=1&limit=5`
      );
      if (retryResp.ok) {
        const data = await retryResp.json();
        if (data && data.length > 0) {
          const first = data[0];
          const newPos = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
          await handleSelectPos(newPos);
          setLocMsg('');
          setIsSearching(false);
          return;
        }
      }

      setLocMsg(t('Location not found. Try entering city name (e.g. Machhe, Belagavi) or clicking directly on the map.'));
    } catch (err) {
      console.error('Search error:', err);
      setLocMsg(t('Search failed. Please click on the map.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateUser = () => {
    if (!globalThis.isSecureContext) {
      setLocMsg(t('Precise location requires HTTPS or localhost. Open this app using a secure address, then allow location access.'));
      return;
    }
    if (navigator.geolocation) {
      setLocMsg(t('Detecting your location...'));
      navigator.geolocation.getCurrentPosition(async pos => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        // Reject 0,0 coordinates
        if (newPos.lat === 0 && newPos.lng === 0) {
          setLocMsg(t('Invalid GPS coordinates. Please click the map to choose your location.'));
          return;
        }
        setLocMsg(t('Location detected! Fetching address...'));
        try {
          await handleSelectPos(newPos);
        } finally {
          setLocMsg('');
        }
      }, err => {
        if (err.code === 1) setLocMsg(t('Location permission denied. Allow location access for this site in your browser settings, then try again.'));
        else if (err.code === 2) setLocMsg(t('Location unavailable. Click on the map to choose your pickup location.'));
        else setLocMsg(t('Location timed out. Click on the map to choose your pickup location.'));
      }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
    } else {
      setLocMsg(t('Geolocation not supported. Click on the map to choose your pickup location.'));
    }
  };

  // Default map center: current position or India
  const mapCenter = currentPos ? [currentPos.lat, currentPos.lng] : [20.5937, 78.9629];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-teal-600" />
          {t("Pickup Location on Map")}
        </label>
        <button
          type="button"
          onClick={handleLocateUser}
          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition flex items-center gap-1 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" /> {t("Use My Location (GPS)")}
        </button>
      </div>

      {/* Location Search Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search area, neighborhood or landmark (e.g. Machhe, Belagavi)...")}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {t("Search Area")}
        </button>
      </form>

      {/* Suggested Quick Chip if user typed an area in the form */}
      {suggestedArea && suggestedArea.trim().length > 1 && (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{t("Quick search:")}</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery(suggestedArea);
              handleSearch(suggestedArea);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
          >
            <MapPin className="w-3 h-3 text-teal-600" />
            {t('Find')} "{suggestedArea}" {t('on map')}
          </button>
        </div>
      )}

      {locMsg && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
          {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" />}
          <span>{locMsg}</span>
        </div>
      )}

      <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <MapContainer center={mapCenter} zoom={currentPos ? 15 : 5} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {currentPos && <Marker position={[currentPos.lat, currentPos.lng]} />}
          <SelectedLocationView position={currentPos} />
          <MapClickHandler setLocation={handleSelectPos} />
        </MapContainer>
      </div>

      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between px-1">
        <span>{t("Selected Coordinates:")}</span>
        <span className="font-mono text-teal-700">
          {currentPos ? (currentPos.lat.toFixed(4) + ", " + currentPos.lng.toFixed(4)) : "No location selected yet"}
        </span>
      </div>
    </div>
  );
};

export default LocationPicker;
import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Navigation, Play, Square, AlertCircle, ShieldCheck, MapPin, Radio, Shirt, Clock } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { calculateDistance } from '../utils/distance';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
const vanIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});
const userPinIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});
function RecenterMap({
  lat,
  lng
}) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}
const LiveClothTrackingMap = ({
  donation,
  isDonorView
}) => {
  const {
    t
  } = useTranslation();
  const {
    user,
    token
  } = useAuth();
  const {
    socket
  } = useSocket();
  const [session, setSession] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [donorPos, setDonorPos] = useState(null);
  const [receiverPos, setReceiverPos] = useState(null);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);
  const [connectedStatus, setConnectedStatus] = useState('Connecting to clothes tracking...');
  const [accessDenied, setAccessDenied] = useState(false);
  const watchIdRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const donorMarkerRef = useRef(null);
  const receiverMarkerRef = useRef(null);
  useEffect(() => {
    if (!donation || !donation._id) return;
    const fetchSession = async () => {
      try {
        const {
          data
        } = await api.get(`/cloth/location/session/${donation._id}`);
        setSession(data.session);
        if (data.donation?.preciseLocation) {
          setDonorPos({
            lat: data.donation.preciseLocation.lat,
            lng: data.donation.preciseLocation.lng
          });
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setAccessDenied(true);
        }
      }
    };
    fetchSession();
  }, [donation]);
  useEffect(() => {
    if (!donation || isCompleted || accessDenied) return;
    const donationId = donation._id;
    const joinRoom = () => {
      socket.emit('JOIN_CLOTH_LOCATION_ROOM', {
        donationId,
        token
      });
    };
    joinRoom();
    const handleRoomJoined = () => {
      setConnectedStatus('Live location tracking is active.');
    };
    const handleAccessDenied = () => {
      setAccessDenied(true);
      setConnectedStatus('Access restricted to connected donor & receiver');
    };
    const handleUpdateReceived = data => {
      const {
        role,
        lat,
        lng
      } = data;
      setLastUpdatedSec(0);
      setConnectedStatus('Live location tracking is active.');
      if (role === 'DONOR') {
        setDonorPos({
          lat,
          lng
        });
        if (donorMarkerRef.current) {
          donorMarkerRef.current.setLatLng([lat, lng]);
        }
      } else {
        setReceiverPos({
          lat,
          lng
        });
        if (receiverMarkerRef.current) {
          receiverMarkerRef.current.setLatLng([lat, lng]);
        }
      }
    };
    const handleShareStarted = () => {
      setConnectedStatus('Live location tracking is active.');
    };
    const handleShareStopped = () => {
      setConnectedStatus('Live location sharing stopped.');
    };
    socket.on('connect', joinRoom);
    socket.on('cloth:location:room_joined', handleRoomJoined);
    socket.on('cloth:location:access_denied', handleAccessDenied);
    socket.on('cloth:location:update_received', handleUpdateReceived);
    socket.on('cloth:location:share_started', handleShareStarted);
    socket.on('cloth:location:share_stopped', handleShareStopped);
    return () => {
      socket.off('connect', joinRoom);
      socket.off('cloth:location:room_joined', handleRoomJoined);
      socket.off('cloth:location:access_denied', handleAccessDenied);
      socket.off('cloth:location:update_received', handleUpdateReceived);
      socket.off('cloth:location:share_started', handleShareStarted);
      socket.off('cloth:location:share_stopped', handleShareStopped);
    };
  }, [donation, token, isCompleted, accessDenied, socket]);
  useEffect(() => {
    const timer = setInterval(() => {
        if (!isSharing && !isCompleted) return;
        setLastUpdatedSec(prev => {
        const next = prev + 1;
        if (next > 30 && isSharing) {
          setConnectedStatus('Location is temporarily unavailable. Waiting for the next update...');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSharing]);
  useEffect(() => {
    if (isCompleted && isSharing) {
      stopLiveSharing();
    }
  }, [isCompleted]);
  const startLiveSharing = () => {
    setShowConsentModal(false);
    if (!navigator.geolocation) {
      setConnectedStatus('Location service is not supported by your browser.');
      return;
    }
    setIsSharing(true);
    setLastUpdatedSec(0);
    setConnectedStatus('Live location tracking is active.');
    const donationId = donation._id;
    socket.emit('cloth:location:start_share', {
      donationId
    });
    watchIdRef.current = navigator.geolocation.watchPosition(pos => {
      const {
        latitude,
        longitude,
        heading,
        accuracy
      } = pos.coords;
      const now = Date.now();
      setLastUpdatedSec(0);
      setConnectedStatus('Live location tracking is active.');
      if (isDonorView) {
        setDonorPos({
          lat: latitude,
          lng: longitude
        });
      } else {
        setReceiverPos({
          lat: latitude,
          lng: longitude
        });
      }
      if (now - lastEmitTimeRef.current >= 3000) {
        lastEmitTimeRef.current = now;
        socket.emit('cloth:location:update', {
          donationId,
          lat: latitude,
          lng: longitude,
          heading: heading || 0,
          accuracy: accuracy || 0
        });
      }
    }, err => {
      setConnectedStatus('Location is temporarily unavailable. Waiting for the next update...');
    }, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000
    });
  };
  const stopLiveSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    setConnectedStatus('GPS Standby');
    if (donation) {
      socket.emit('cloth:location:stop_share', {
        donationId: donation._id
      });
    }
  };
  if (accessDenied) {
    return <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-sm">{t("ACCESS RESTRICTED")}</p>
        <p className="text-slate-600 font-normal">{t("Live GPS location tracking for clothes is accessible only to the donor and the accepted receiver.")}</p>
      </div>;
  }
  const liveDistance = donorPos && receiverPos ? calculateDistance(donorPos.lat, donorPos.lng, receiverPos.lat, receiverPos.lng) : null;
  const initialCenter = donorPos ? [donorPos.lat, donorPos.lng] : (receiverPos ? [receiverPos.lat, receiverPos.lng] : null);
  let etaDisplay = t("Calculating ETA...");
  if (liveDistance !== null) {
    const speedKmh = 30; // Approx 30 km/h in city
    const timeHours = parseFloat(liveDistance) / speedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    if (timeMinutes < 1) {
      etaDisplay = 'Arriving now';
    } else {
      etaDisplay = `Approximately ${timeMinutes} min away`;
    }
  }
  return <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {isSharing ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300">
                <Radio className="w-3.5 h-3.5 text-rose-600 animate-spin" /> {t("🔴 LIVE CLOTHES TRACKING")}
              </span> : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200">
                <Shirt className="w-3.5 h-3.5 text-indigo-600" /> {t("GPS Standby")}
              </span>}
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              {connectedStatus}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">{t("Clothes Transfer Live Map")}</h3>
        </div>

        {!isCompleted && <div>
            {isSharing ? <button type="button" onClick={stopLiveSharing} className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">
                <Square className="w-4 h-4 fill-white" /> {t("Stop Live Location")}
              </button> : <button type="button" onClick={() => setShowConsentModal(true)} className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">
                <Play className="w-4 h-4 fill-white" />
                {isDonorView ? 'Start Live Location' : 'Share My Live Location'}
              </button>}
          </div>}
      </div>

      {/* Distance, ETA & Last Updated Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-700">
          <Navigation className="w-4 h-4 text-indigo-600" />
          <span>
            {t("Distance:")}{' '}
            <strong className="text-slate-900 font-extrabold">
              {liveDistance !== null ? `${liveDistance} km` : 'Unavailable'}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>
            {t("ETA:")}{' '}
            <strong className="text-slate-900 font-extrabold">
              {liveDistance !== null ? etaDisplay : 'Unavailable'}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 justify-start sm:justify-end">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{t("Last updated:")} <strong className="text-slate-700">{lastUpdatedSec}{t("s ago")}</strong></span>
        </div>
      </div>

      {/* Leaflet Map */}
      
      <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        {initialCenter ? (
          <MapContainer center={initialCenter} zoom={14} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer 
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            />
            <MapUpdater donorPos={donorPos} receiverPos={receiverPos} />

            {/* Donor Position Marker */}
            {donorValid && donorPos && (
              <Marker position={[donorPos.lat, donorPos.lng]} icon={carIcon || userPinIcon}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-extrabold text-xs text-slate-900">{t("Donor Location")}</p>
                    <p className="text-[10px] text-slate-500">{isDonorView ? 'You (Donor)' : 'Connected Donor'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Receiver Position Marker */}
            {receiverValid && receiverPos && (
              <Marker position={[receiverPos.lat, receiverPos.lng]} icon={userPinIcon}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-extrabold text-xs text-slate-900">{t("Receiver Location")}</p>
                    <p className="text-[10px] text-slate-500">{!isDonorView ? 'You (Receiver)' : 'Connected Receiver'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Line showing route/connection */}
            {donorValid && donorPos && receiverValid && receiverPos && (
              <Polyline positions={[[donorPos.lat, donorPos.lng], [receiverPos.lat, receiverPos.lng]]} color="#0d9488" weight={4} dashArray="8, 8" />
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-slate-500 text-sm">{t("Waiting for location data...")}</p>
             <p className="text-xs text-slate-400 mt-1">{t("Live map will appear once GPS is shared.")}</p>
          </div>
        )}
      </div>

      {/* Consent Modal Dialog */}
      {showConsentModal && <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t("Live Clothes Location Permission")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("Your live location will be shared only with the connected")} {isDonorView ? 'cloth receiver' : 'cloth donor'} {t("during this transfer session.")}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <p className="font-bold">{t("Privacy Controls:")}</p>
              <p>{t("• Only active while location sharing is enabled by you.")}</p>
              <p>{t("• Automatically terminates when clothes received confirmation is completed.")}</p>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowConsentModal(false)} className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                {t("Not Now")}
              </button>
              <button type="button" onClick={startLiveSharing} className="w-1/2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer">
                {t("Allow & Start")}
              </button>
            </div>
          </div>
        </div>}

    </div>;
};
export default LiveClothTrackingMap;
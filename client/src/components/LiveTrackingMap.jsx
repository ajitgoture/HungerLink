import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Navigation, Play, Square, AlertCircle, ShieldCheck, MapPin, Radio, Wifi, WifiOff, Clock, Phone, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { calculateDistance } from '../utils/distance';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Marker Default Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Custom Car / Person Marker Icons
const carIcon = new L.Icon({
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
const normalizeLocation = (value) => {
  if (!value || typeof value !== 'object') return null;
  const coordinates = Array.isArray(value.coordinates) ? value.coordinates : null;
  const lat = value.lat ?? value.latitude ?? (coordinates?.length === 2 ? coordinates[1] : undefined);
  const lng = value.lng ?? value.longitude ?? (coordinates?.length === 2 ? coordinates[0] : undefined);
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

const hasValidCoordinatePair = (value) => !!normalizeLocation(value);

// Map View auto-recenter component
function RecenterMap({
  lat,
  lng
}) {
  const map = useMap();
  useEffect(() => {
    const position = normalizeLocation({ lat, lng });
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

// Auto bounds fitter
const MapUpdater = ({ donorPos, receiverPos, recenterTrigger }) => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
      const bounds = L.latLngBounds();
      let hasPts = false;
      if (hasValidCoordinatePair(donorPos)) { bounds.extend([donorPos.lat, donorPos.lng]); hasPts = true; }
      if (hasValidCoordinatePair(receiverPos)) { bounds.extend([receiverPos.lat, receiverPos.lng]); hasPts = true; }
      if (hasPts) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }, 200);
    return () => clearTimeout(timeout);
  }, [donorPos, receiverPos, map, recenterTrigger]);
  return null;
};

const LiveTrackingMap = ({
  donation,
  requestStatus,
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
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);
  const [locationPermissionBlocked, setLocationPermissionBlocked] = useState(false);
  const [gpsState, setGpsState] = useState('NOT_AVAILABLE');
  const [trackingCompleted, setTrackingCompleted] = useState(false);
  const [isConfirmingArrival, setIsConfirmingArrival] = useState(false);
  const isCompleted = trackingCompleted
    || ['RECEIVED', 'COMPLETED', 'EXPIRED'].includes(donation?.status)
    || ['RECEIVED', 'COMPLETED', 'EXPIRED'].includes(requestStatus);
  const hasArrived = isDonorView ? session?.donorArrived : session?.receiverArrived;
  const partnerArrived = isDonorView ? session?.receiverArrived : session?.donorArrived;
  const isDelivery = session?.transferMethod === 'DELIVERY' || session?.trackingMode === 'DELIVERY';
  const isMovingUser = (isDelivery && isDonorView) || (!isDelivery && !isDonorView);
  const [connectedStatus, setConnectedStatus] = useState(isCompleted ? 'Tracking ended' : 'Connecting to live tracking...');
  const [accessDenied, setAccessDenied] = useState(false);
  const [sharingByRole, setSharingByRole] = useState({ DONOR: false, RECEIVER: false });
  const watchIdRef = useRef(null);
  const autoStartAttemptedRef = useRef(false);
  const announcedShareRef = useRef(false);
  const lastEmitTimeRef = useRef(0);
  const donorMarkerRef = useRef(null);
  const receiverMarkerRef = useRef(null);
  // Load Initial Location Session Data
  useEffect(() => {
    if (!donation || !_idCheck() || isCompleted) return;
    const fetchSession = async () => {
      try {
        const modulePath = donation.foodName ? 'food' : 'cloth';
        const { data } = await api.get(`/${modulePath}/location/session/${donation._id || donation.id}`);
        setSession(data.session);

        const initialDonor = normalizeLocation(data.donation?.preciseLocation || data.donation?.approximateLocation);
        if (initialDonor) {
          setDonorPos(initialDonor);
        }

        if (data.session) {
          const donorLocation = normalizeLocation(data.session.donorLiveLocation) || normalizeLocation(data.session.donorLocation);
          const receiverLocation = normalizeLocation(data.session.receiverLiveLocation) || normalizeLocation(data.session.receiverLocation);
          if (donorLocation) setDonorPos(donorLocation);
          if (receiverLocation) setReceiverPos(receiverLocation);
           if (data.session.handoverLocation) {
             const handoverLocation = normalizeLocation(data.session.handoverLocation);
             if (handoverLocation) {
               if (data.session.trackingMode === 'DELIVERY') {
                  if (!data.session.receiverLocation || !normalizeLocation(data.session.receiverLocation)) setReceiverPos(handoverLocation);
               } else if (data.session.trackingMode === 'PICKUP') {
                  if (!data.session.donorLocation || !normalizeLocation(data.session.donorLocation)) setDonorPos(handoverLocation);
               }
             }
          }
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setAccessDenied(true);
        }
      }
    };
    fetchSession();
  }, [donation, isCompleted]);
  function _idCheck() { return donation && (donation._id || donation.id); }

  // Socket Room Joining & Event Listeners
  useEffect(() => {
    if (!donation || isCompleted || accessDenied) return;
    const donationId = donation._id || donation.id;
    const joinRoom = () => {
      socket.emit('JOIN_TRANSFER_ROOM', {
        transferId: donationId,
        moduleType: 'food',
        token
      });
    };
    const handleRoomJoined = () => {
      setConnectedStatus(t('Connected. Waiting for location.'));
    };
    const handleAccessDenied = () => {
      setAccessDenied(true);
      setConnectedStatus(t('Access restricted to connected donor & receiver'));
    };
    const handleUpdateReceived = data => {
      if (data && data.role) {
        setSharingByRole(prev => ({ ...prev, [data.role]: true }));
      }
      const normalized = normalizeLocation(data);
      if (!normalized) {
        return;
      }
      const { role } = data;
      setLastUpdatedSec(0);
      setGpsState('LIVE');
      setConnectedStatus(t('Live location tracking is active.'));
      if (role === 'DONOR') {
        setDonorPos(normalized);
        if (donorMarkerRef.current) {
          donorMarkerRef.current.setLatLng([normalized.lat, normalized.lng]);
        }
      } else {
        setReceiverPos(normalized);
        if (receiverMarkerRef.current) {
          receiverMarkerRef.current.setLatLng([normalized.lat, normalized.lng]);
        }
      }
    };
    const handleShareStarted = (data) => {
      if (data && data.role) {
        setSharingByRole(prev => ({ ...prev, [data.role]: true }));
      }
      setConnectedStatus(t('Live location tracking is active.'));
    };
    const handleShareStopped = (data) => {
      if (data && data.role) {
        setSharingByRole(prev => ({ ...prev, [data.role]: false }));
      }
      if (data?.role === (isDonorView ? 'DONOR' : 'RECEIVER')) {
        setIsSharing(false);
        setGpsState('STOPPED');
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      }
      setConnectedStatus(t('Live location sharing stopped.'));
    };
    const handleSync = (data) => {
      setSession(previous => ({ ...previous, ...data }));
      setSharingByRole({ DONOR: Boolean(data.donorSharing), RECEIVER: Boolean(data.receiverSharing) });
      const donorLocation = normalizeLocation(data.donorLiveLocation);
      const receiverLocation = normalizeLocation(data.receiverLiveLocation);
      if (donorLocation) setDonorPos(donorLocation);
      if (receiverLocation) setReceiverPos(receiverLocation);
      if (data.handoverLocation) {
        const handoverLocation = normalizeLocation(data.handoverLocation);
        if (handoverLocation && data.trackingMode === 'DELIVERY') setReceiverPos(handoverLocation);
        if (handoverLocation && data.trackingMode === 'PICKUP') setDonorPos(handoverLocation);
      }
    };
    const handleArrivalUpdate = (data) => {
      setSession(previous => ({ ...previous, ...data }));
    };
    const handleStatusUpdate = (data) => setSession(previous => ({ ...previous, status: data.status }));
    const handleHandoverStarted = (data) => {
      setSession(previous => ({ ...previous, status: data.status }));
    };
    const handleTransferCompleted = () => {
      setTrackingCompleted(true);
      setGpsState('STOPPED');
      setIsSharing(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    const handleLocationError = (data) => {
      setConnectedStatus(data?.message ? t(data.message) : t('Location is temporarily unavailable.'));
    };
    const handleSocketError = () => setConnectedStatus(t('Unable to connect to live tracking.'));
    const handleSocketDisconnect = () => {
      if (!isCompleted) setConnectedStatus(t('Connection lost. Reconnecting...'));
    };
    const handleTransferError = (data) => {
      setConnectedStatus(data?.message ? t(data.message) : t('Unable to connect to live tracking.'));
    };

    // Rejoin room seamlessly on socket reconnect
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();
    socket.on('connect_error', handleSocketError);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('transfer:error', handleTransferError);
    socket.on('transfer:room_joined', handleRoomJoined);
    socket.on('transfer:sync', handleSync);
    socket.on('transfer:access_denied', handleAccessDenied);
    socket.on('transfer:location-update', handleUpdateReceived);
    socket.on('transfer:tracking-started', handleShareStarted);
    socket.on('transfer:tracking-stopped', handleShareStopped);
    socket.on('transfer:arrival-updated', handleArrivalUpdate);
    socket.on('transfer:status-updated', handleStatusUpdate);
    socket.on('transfer:handover-started', handleHandoverStarted);
    socket.on('transfer:completed', handleTransferCompleted);
    socket.on('transfer:location-error', handleLocationError);
    return () => {
      socket.off('connect', joinRoom);
      socket.off('connect_error', handleSocketError);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('transfer:error', handleTransferError);
      socket.off('transfer:room_joined', handleRoomJoined);
      socket.off('transfer:sync', handleSync);
      socket.off('transfer:access_denied', handleAccessDenied);
      socket.off('transfer:location-update', handleUpdateReceived);
      socket.off('transfer:tracking-started', handleShareStarted);
      socket.off('transfer:tracking-stopped', handleShareStopped);
      socket.off('transfer:arrival-updated', handleArrivalUpdate);
      socket.off('transfer:status-updated', handleStatusUpdate);
      socket.off('transfer:handover-started', handleHandoverStarted);
      socket.off('transfer:completed', handleTransferCompleted);
      socket.off('transfer:location-error', handleLocationError);
    };
  }, [donation, token, isCompleted, accessDenied, socket]);

  // Last Updated Timer Counter with 30s Graceful Stale Recovery
  useEffect(() => {
    if (gpsState !== 'LIVE') return undefined;
    const timer = setInterval(() => {
        setLastUpdatedSec(prev => {
        const next = prev + 1;
        if (next >= 30) {
          setGpsState('STALE');
          setConnectedStatus(t('Location is stale. Waiting for a new GPS update.'));
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gpsState, t]);

  // Automatic Stop on Completion
  useEffect(() => {
    if (isCompleted && isSharing) {
      stopLiveSharing();
    }
  }, [isCompleted]);

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      socket.emit('transfer:stop_tracking', { donationId: donation?._id || donation?.id });
    }
  }, [socket, donation?._id, donation?.id]);

  // Start Geolocation watchPosition
  function startLiveSharing() {
    setShowConsentModal(false);
    setLocationPermissionBlocked(false);
    if (watchIdRef.current !== null) return;
    if (!navigator.geolocation) {
      setGpsState('NOT_AVAILABLE');
      setConnectedStatus(t('Location service is not available.'));
      return;
    }

    setIsSharing(true);
    setGpsState('ACQUIRING');
    setLastUpdatedSec(0);
    setConnectedStatus(t('Acquiring GPS location...'));
    const donationId = donation._id || donation.id;
    announcedShareRef.current = false;
    watchIdRef.current = navigator.geolocation.watchPosition(pos => {
      const {
        latitude,
        longitude,
        heading,
        accuracy
      } = pos.coords;
      const now = Date.now();
      if (!normalizeLocation({ lat: latitude, lng: longitude })) return;
      setLastUpdatedSec(0);
      setGpsState('LIVE');
      setConnectedStatus('Live location tracking is active.');
      if (!announcedShareRef.current) {
        socket.emit('transfer:tracking-started', { donationId });
        announcedShareRef.current = true;
      }

      // Update local position
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

      // Throttle Socket.IO emit every 3 seconds
      if (now - lastEmitTimeRef.current >= 3000) {
        lastEmitTimeRef.current = now;
        socket.emit('transfer:location-update', {
          donationId,
          latitude,
          longitude,
          heading: heading || 0,
          accuracy,
          timestamp: pos.timestamp
        });
      }
    }, err => {
      if (err.code === 1) {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsSharing(false);
        setLocationPermissionBlocked(true);
        setGpsState('PERMISSION_REQUIRED');
        setConnectedStatus(t('Location permission is required for live tracking.'));
      } else {
        setGpsState('NOT_AVAILABLE');
        setConnectedStatus(t('Location is temporarily unavailable.'));
      }
      if (err.code === 1 && announcedShareRef.current) socket.emit('transfer:stop_tracking', { donationId });
      if (err.code === 1) announcedShareRef.current = false;
    }, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000
    });
  };

  // Stop Geolocation watchPosition
  function stopLiveSharing() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    announcedShareRef.current = false;
    setGpsState('STOPPED');
    setConnectedStatus(t('Live location sharing stopped.'));
    if (donation) {
      const donationId = donation._id || donation.id;
      socket.emit('transfer:stop_tracking', {
        donationId
      });
    }
  };

  useEffect(() => {
    if (!donation || isCompleted || accessDenied || !isMovingUser || isSharing || autoStartAttemptedRef.current || !session?.trackingMode) return;

    const shouldAutoStart = ['TRACKING', 'APPROACHING'].includes(donation.status);
    if (!shouldAutoStart) return;

    const tryAutoStart = async () => {
      if (!navigator.geolocation) {
        setGpsState('NOT_AVAILABLE');
        setConnectedStatus(t('Location service is not available.'));
        return;
      }
      autoStartAttemptedRef.current = true;

      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          if (permissionStatus.state === 'denied') {
            setLocationPermissionBlocked(true);
            setConnectedStatus('Location permission is required for live tracking.');
            return;
          }
        }
      } catch (error) {
        // Ignore permission API failures and rely on the geolocation request itself.
      }

      startLiveSharing();
    };

    tryAutoStart();
  }, [donation, isCompleted, accessDenied, isMovingUser, isSharing, session?.trackingMode, t]);

  // Calculate live Haversine distance if both locations present
  const liveDistance = donorPos && receiverPos ? calculateDistance(donorPos.lat, donorPos.lng, receiverPos.lat, receiverPos.lng) : null;
  const transferStatus = session?.status || donation.status;
  const donorValid = hasValidCoordinatePair(donorPos);
  const receiverValid = hasValidCoordinatePair(receiverPos);
  const initialCenter = (donorValid && receiverValid) ? [donorPos.lat, donorPos.lng] : (donorValid ? [donorPos.lat, donorPos.lng] : (receiverValid ? [receiverPos.lat, receiverPos.lng] : null));
  
  // Icon Resolution: If pickup, receiver moves (car), donor stationary (pin). If delivery, donor moves (car).
  
  const handleMarkArrived = async () => {
    if (isConfirmingArrival || hasArrived || !navigator.geolocation) return;
    setIsConfirmingArrival(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { data } = await api.patch(`/transfer/food/${donation._id || donation.id}/arrived`, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setSession(previous => ({ ...previous, ...data.session, status: data.donation?.status }));
        setGpsState('LIVE');
        setLastUpdatedSec(0);
        setConnectedStatus(t('Arrival confirmed.'));
      } catch (error) {
        setConnectedStatus(error.response?.data?.message || t('Unable to confirm arrival.'));
      } finally {
        setIsConfirmingArrival(false);
      }
    }, (error) => {
      setIsConfirmingArrival(false);
      if (error.code === 1) {
        setLocationPermissionBlocked(true);
        setGpsState('PERMISSION_REQUIRED');
        setConnectedStatus(t('Location permission is required for live tracking.'));
      } else {
        setGpsState('NOT_AVAILABLE');
        setConnectedStatus(t('Location is temporarily unavailable.'));
      }
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  if (isCompleted) {
    return <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
        <p className="text-sm">{t("Tracking ended")}</p>
        <p className="text-slate-600 font-normal">{t("Live location tracking has ended for this completed transfer.")}</p>
      </div>;
  }

  if (accessDenied) {
    return <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-sm">{t("ACCESS RESTRICTED")}</p>
        <p className="text-slate-600 font-normal">{t("Live GPS location tracking is accessible only to the donor and the accepted receiver.")}</p>
      </div>;
  }

  const donorIconToUse = isDelivery ? carIcon : userPinIcon;
  const receiverIconToUse = isDelivery ? userPinIcon : carIcon;
  
  const partnerName = isDonorView ? donation.acceptedReceiver?.name : donation.donor?.name;
  const partnerPhone = isDonorView ? donation.acceptedReceiver?.phone : donation.donor?.phone;
    
  const getHeaderStatus = () => {
    if (!session) return t("Loading...");
    if (transferStatus === 'COMPLETED') return t("Completed");
    if (transferStatus === 'QR_VERIFIED') return t("QR Verified");
    if (transferStatus === 'HANDOVER_READY') return t("Ready for handover");
    if (transferStatus === 'APPROACHING') return t('Approaching');
    if (transferStatus === 'ARRIVED') return t("Both participants have arrived");
    
    if (session.trackingMode === 'PICKUP') {
      if (transferStatus === 'READY_FOR_PICKUP') return t("Ready for Pickup");
      if (transferStatus === 'TRACKING') return t("Receiver is on the way");
    } else if (session.trackingMode === 'DELIVERY') {
      if (transferStatus === 'READY_FOR_DELIVERY') return t("Deliver Food");
      if (transferStatus === 'TRACKING') return t("Donor is on the way");
    }
    return t("Connecting...");
  };

  const statusText = getHeaderStatus();

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col mt-4">
      {locationPermissionBlocked && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-bold">
          {t('Location permission is required for live tracking.')}
        </div>
      )}
      
      {/* 1. TRACKING HEADER */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          {isSharing || Object.values(sharingByRole).some(Boolean) ? <Radio className="w-4 h-4 text-emerald-600 animate-pulse" /> : null}
          {statusText}
        </h3>
        <span className="text-[11px] font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          {connectedStatus}
        </span>
      </div>

      {/* 2. MAP AREA */}
      <div className="h-64 sm:h-80 w-full relative z-0">
        <button 
          onClick={() => setRecenterTrigger(prev => prev + 1)}
          className="absolute top-4 right-4 z-[400] bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl shadow-md text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5" /> {t("Recenter")}
        </button>
        
        {initialCenter ? (
          <MapContainer center={initialCenter} zoom={14} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapUpdater donorPos={donorPos} receiverPos={receiverPos} recenterTrigger={recenterTrigger} />
            {donorValid && donorPos && (
              <Marker position={[donorPos.lat, donorPos.lng]} icon={donorIconToUse} ref={donorMarkerRef}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-extrabold text-xs text-slate-900">{session?.donor?.name || t("Donor")}</p>
                    <p className="text-[10px] text-slate-500">{sharingByRole.DONOR ? (isDonorView ? 'You (Moving)' : 'Connected Donor (Moving)') : t("Fixed Destination")}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {receiverValid && receiverPos && (
              <Marker position={[receiverPos.lat, receiverPos.lng]} icon={receiverIconToUse} ref={receiverMarkerRef}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-extrabold text-xs text-slate-900">{session?.receiver?.name || t("Receiver")}</p>
                    <p className="text-[10px] text-slate-500">{!isDonorView ? 'You (Moving)' : 'Connected Receiver (Moving)'}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {donorValid && donorPos && receiverValid && receiverPos && (
              <Polyline positions={[[donorPos.lat, donorPos.lng], [receiverPos.lat, receiverPos.lng]]} color="#0d9488" weight={4} dashArray="8, 8" />
            )}
          </MapContainer>
        ) : (
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
             <MapPin className="w-8 h-8 text-slate-300 mb-2" />
             <p className="font-bold text-slate-500 text-sm">{t("Waiting for location data...")}</p>
             <p className="text-xs text-slate-400 mt-1">{t("Live map will appear once GPS is shared.")}</p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CARD */}
      <div className="p-4 sm:p-6 space-y-5 bg-white relative">
        {/* I'm Here Overlay inside the card if needed */}
        {!isCompleted && !accessDenied && !hasArrived && ['TRACKING', 'APPROACHING', 'ARRIVED'].includes(transferStatus)
          && liveDistance !== null && liveDistance * 1000 <= 30 && (
          <div className="mb-4">
            <button 
              onClick={handleMarkArrived}
              disabled={isConfirmingArrival}
              className="w-full bg-emerald-600 text-white shadow-lg py-3 px-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> {isConfirmingArrival ? t('Checking GPS...') : t("I'm Here")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-indigo-500" />{t("Distance")}</p>
            <p className="text-slate-900 font-black text-sm">{liveDistance !== null ? (liveDistance < 1 ? `${Math.round(liveDistance * 1000)} m` : `${liveDistance.toFixed(1)} km`) : '-'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" />{t("ETA")}</p>
            <p className="text-slate-900 font-black text-sm">{t("Unavailable")}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-emerald-500" />{t("GPS")}</p>
            <p className="text-slate-900 font-black text-sm">{t(`gpsState_${gpsState}`)} {gpsState === 'LIVE' || gpsState === 'STALE' ? <span className="text-[10px] text-slate-500 font-normal ml-1">({lastUpdatedSec}s)</span> : null}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-slate-500 font-semibold mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" />{t("Accuracy")}</p>
            <p className="text-slate-900 font-black text-sm">{isDonorView ? (donorPos?.accuracy ? `±${Math.round(donorPos.accuracy)}m` : '-') : (receiverPos?.accuracy ? `±${Math.round(receiverPos.accuracy)}m` : '-')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
              {partnerName ? partnerName.charAt(0) : 'P'}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{isDonorView ? t("Receiver") : t("Donor")}</p>
              <p className="font-extrabold text-slate-900">{partnerName || t("Partner")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {!isCompleted && isMovingUser && !isSharing && ['TRACKING', 'APPROACHING'].includes(transferStatus) && (
              <button type="button" onClick={() => setShowConsentModal(true)} className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                <Play className="w-3.5 h-3.5 fill-white" /> {t("Start Live Location")}
              </button>
            )}
            {partnerPhone && (
              <a href={`tel:${partnerPhone}`} className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200">
                <Phone className="w-3.5 h-3.5" /> {isDonorView ? t("Call Receiver") : t("Call Donor")}
              </a>
            )}
            {(isDonorView ? (receiverValid && receiverPos) : (donorValid && donorPos)) && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${isDonorView ? (receiverPos ? receiverPos.lat + ',' + receiverPos.lng : '') : (donorPos ? donorPos.lat + ',' + donorPos.lng : '')}`}
                target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                <Navigation className="w-3.5 h-3.5 fill-white" /> {t("Open Maps")}
              </a>
            )}
            
            {/* Start Live Location logic - Hidden if automatically tracking or already sharing */}
            {isSharing && (
              <button type="button" onClick={stopLiveSharing} className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                <Square className="w-3.5 h-3.5 fill-white" /> {t("Stop Live Location")}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Consent Modal Dialog */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-100">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">{t("Location permission")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("Your live location will be shared strictly with the connected partner during this transfer.")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowConsentModal(false)} className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                {t("Not Now")}
              </button>
              <button type="button" onClick={startLiveSharing} className="w-1/2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition cursor-pointer">
                {t("Allow & Start")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

};
export default LiveTrackingMap;

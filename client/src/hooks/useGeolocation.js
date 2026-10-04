import { useState, useEffect, useCallback, useRef } from 'react';

export const GPS_STATUS = {
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  PERMISSION_REQUIRED: 'PERMISSION_REQUIRED',
  ACQUIRING: 'ACQUIRING',
  LIVE: 'LIVE',
  STALE: 'STALE',
  STOPPED: 'STOPPED'
};

const useGeolocation = (options = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }) => {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [status, setStatus] = useState(GPS_STATUS.STOPPED);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setStatus(GPS_STATUS.STOPPED);
    }
  }, []);

  // Handle successful location grab
  const handleSuccess = useCallback((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const acc = position.coords.accuracy;

    // Validate bounds immediately
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
      setStatus(GPS_STATUS.STALE);
      setError('Invalid coordinates received from GPS.');
      return;
    }

    setLocation({ lat, lng });
    setAccuracy(acc);
    setTimestamp(position.timestamp);
    setStatus(GPS_STATUS.LIVE);
    setError(null);
  }, []);

  // Handle errors
  const handleError = useCallback((err) => {
    if (err.code === 1) {
      setStatus(GPS_STATUS.PERMISSION_REQUIRED);
      setError('Location permission denied.');
    } else {
      setStatus(GPS_STATUS.NOT_AVAILABLE);
      setError(err.message || 'GPS signal lost or unavailable.');
    }
  }, []);

  // Get initial single position
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus(GPS_STATUS.NOT_AVAILABLE);
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setStatus(GPS_STATUS.ACQUIRING);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  }, [handleSuccess, handleError, options]);

  // Start live watch position
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus(GPS_STATUS.NOT_AVAILABLE);
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setStatus(GPS_STATUS.ACQUIRING);
    stopTracking(); // Clear any existing watch
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  }, [handleSuccess, handleError, stopTracking, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    accuracy,
    timestamp,
    status,
    error,
    getCurrentLocation,
    startTracking,
    stopTracking
  };
};

export default useGeolocation;

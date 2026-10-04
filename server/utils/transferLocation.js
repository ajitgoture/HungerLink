const { validateCoordinates } = require('./locationValidator');

const PROXIMITY_THRESHOLDS_METERS = Object.freeze({
  approaching: 500,
  near: 100,
  handover: 30,
});

const hasValidCoordinates = (latitude, longitude) =>
  validateCoordinates(latitude, longitude);

const calculateDistanceMeters = (latitude1, longitude1, latitude2, longitude2) => {
  if (!hasValidCoordinates(latitude1, longitude1) || !hasValidCoordinates(latitude2, longitude2)) {
    return null;
  }

  const radians = (degrees) => Number(degrees) * Math.PI / 180;
  const deltaLatitude = radians(Number(latitude2) - Number(latitude1));
  const deltaLongitude = radians(Number(longitude2) - Number(longitude1));
  const firstLatitude = radians(latitude1);
  const secondLatitude = radians(latitude2);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const classifyProximity = (distanceMeters) => {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return 'UNAVAILABLE';
  if (distanceMeters <= PROXIMITY_THRESHOLDS_METERS.handover) return 'HANDOVER_ZONE';
  if (distanceMeters <= PROXIMITY_THRESHOLDS_METERS.near) return 'NEAR';
  if (distanceMeters <= PROXIMITY_THRESHOLDS_METERS.approaching) return 'APPROACHING';
  return 'NORMAL';
};

const getMovingRole = (mode) => {
  if (mode === 'DELIVERY') return 'DONOR';
  if (mode === 'PICKUP') return 'RECEIVER';
  return null;
};

const recordParticipantArrival = (session, role, timestamp = new Date()) => {
  if (role === 'DONOR') {
    session.donorArrived = true;
    session.donorArrivedAt = timestamp;
  } else if (role === 'RECEIVER') {
    session.receiverArrived = true;
    session.receiverArrivedAt = timestamp;
  }

  return Boolean(session.donorArrived && session.receiverArrived);
};

module.exports = {
  PROXIMITY_THRESHOLDS_METERS,
  hasValidCoordinates,
  calculateDistanceMeters,
  classifyProximity,
  getMovingRole,
  recordParticipantArrival,
};
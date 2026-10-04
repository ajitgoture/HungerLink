/**
 * Validates real GPS coordinates to prevent fake, default, or out-of-bounds locations.
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Boolean} true if valid, false if invalid
 */
const validateCoordinates = (lat, lng) => {
  // Reject null, undefined, NaN
  if (lat === null || lat === undefined || isNaN(lat)) return false;
  if (lng === null || lng === undefined || isNaN(lng)) return false;

  const numLat = Number(lat);
  const numLng = Number(lng);

  // Reject strictly 0,0 (Null Island)
  if (numLat === 0 && numLng === 0) return false;

  // Geographic bounds
  if (numLat < -90 || numLat > 90) return false;
  if (numLng < -180 || numLng > 180) return false;

  // Reject known fallback/hardcoded fake coordinates
  // NYC Hardcode from legacy codebase
  if (numLat.toFixed(4) === '40.7128' && numLng.toFixed(4) === '-74.0060') return false;
  // India center fallback
  if (numLat.toFixed(4) === '20.5937' && numLng.toFixed(4) === '78.9629') return false;

  return true;
};

const isValidGeoPoint = (value) => {
  if (!value || typeof value !== 'object' || value.type !== 'Point') return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;
  const [lng, lat] = value.coordinates;
  return Number.isFinite(Number(lng)) && Number.isFinite(Number(lat))
    && validateCoordinates(lat, lng);
};

const toGeoPoint = (lat, lng) => {
  if (!validateCoordinates(lat, lng)) return undefined;
  return { type: 'Point', coordinates: [Number(lng), Number(lat)] };
};

const toGeoPointFromObject = (value) => {
  if (!value || typeof value !== 'object') return undefined;
  if (isValidGeoPoint(value)) return value;
  if (Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng))) {
    return toGeoPoint(value.lat, value.lng);
  }
  return undefined;
};

const sanitizeGeoPointField = (value) => {
  if (value === undefined || value === null) return undefined;
  const point = toGeoPointFromObject(value);
  return point || undefined;
};

module.exports = {
  validateCoordinates,
  isValidGeoPoint,
  toGeoPoint,
  toGeoPointFromObject,
  sanitizeGeoPointField,
};

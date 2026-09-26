// server/services/matchingService.js

// Centralized Configuration for Matching Weights
const MATCHING_CONFIG = {
  DISTANCE_WEIGHT: 0.30,
  URGENCY_WEIGHT: 0.25,
  EXPIRY_PROXIMITY_WEIGHT: 0.20,
  QUANTITY_FIT_WEIGHT: 0.15,
  RELIABILITY_WEIGHT: 0.10,
  MAX_DISTANCE_KM: 50, // Beyond 50km, distance score is 0
};

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * @returns {number} distance in km
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return MATCHING_CONFIG.MAX_DISTANCE_KM; // default worst case
  
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
};

/**
 * Calculates a normalized score (0-100) for a given request against a donation.
 * 
 * @param {Object} donation - The donation document (Food or Cloth)
 * @param {Object} request - The request document (populated with receiver)
 * @returns {number} score 0-100
 */
const calculateMatchScore = (donation, request) => {
  const receiver = request.receiver;
  if (!receiver) return 0; // Invalid request
  
  let totalScore = 0;

  // 1. Distance (30%)
  const donLat = donation.preciseLocation?.lat || donation.approximateLocation?.lat;
  const donLng = donation.preciseLocation?.lng || donation.approximateLocation?.lng;
  const recLat = receiver.location?.lat;
  const recLng = receiver.location?.lng;

  const distanceKm = calculateDistance(donLat, donLng, recLat, recLng);
  // Normalize distance: 0km = 100%, >= MAX_DISTANCE_KM = 0%
  let distanceScore = 100 * (1 - Math.min(distanceKm / MATCHING_CONFIG.MAX_DISTANCE_KM, 1));
  totalScore += distanceScore * MATCHING_CONFIG.DISTANCE_WEIGHT;

  // 2. Urgency (25%) - e.g. how fast the request was made after creation, or if receiver marked urgent
  // Since we don't have a specific 'urgency' field on the request, we can use request timing.
  // Quicker request = higher urgency score.
  const timeToRequestMs = new Date(request.createdAt) - new Date(donation.createdAt);
  const maxUrgencyMs = 24 * 60 * 60 * 1000; // 24 hours
  let urgencyScore = 100 * (1 - Math.min(Math.max(timeToRequestMs, 0) / maxUrgencyMs, 1));
  totalScore += urgencyScore * MATCHING_CONFIG.URGENCY_WEIGHT;

  // 3. Expiry Proximity (20%) 
  // If the item is expiring very soon, and the user requested recently, they get a boost because they are active now.
  const now = new Date();
  const timeToExpiryMs = new Date(donation.expiryTime) - now;
  const hoursToExpiry = timeToExpiryMs / (1000 * 60 * 60);
  
  let expiryScore = 50; // default baseline
  if (hoursToExpiry < 3 && timeToRequestMs > 0) {
    // Highly urgent donation
    expiryScore = 100;
  } else if (hoursToExpiry < 12) {
    expiryScore = 80;
  } else {
    expiryScore = 60;
  }
  totalScore += expiryScore * MATCHING_CONFIG.EXPIRY_PROXIMITY_WEIGHT;

  // 4. Quantity Fit (15%)
  // If receiver specified a required quantity (currently not in schema, so assume 100% fit)
  const quantityScore = 100; // Placeholder until receiver-specific quantity requests are implemented
  totalScore += quantityScore * MATCHING_CONFIG.QUANTITY_FIT_WEIGHT;

  // 5. Reliability (10%)
  // Currently we default to 80% if no historical data is available on the user model.
  const reliabilityScore = receiver.reliabilityScore || 80;
  totalScore += reliabilityScore * MATCHING_CONFIG.RELIABILITY_WEIGHT;

  // Final normalization to ensure bounds
  const normalizedScore = Math.min(Math.max(Math.round(totalScore), 0), 100);

  return {
    score: normalizedScore,
    metrics: {
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      urgencyScore: Math.round(urgencyScore),
      reliabilityScore: Math.round(reliabilityScore)
    }
  };
};

/**
 * Evaluates all pending requests for a donation and returns them sorted by match score.
 * 
 * @param {Object} donation 
 * @param {Array} requests - Array of populated request objects
 * @returns {Array} requests mapped with { ...request, matchData: { score, metrics } }
 */
const rankRequests = (donation, requests) => {
  const ranked = requests.map(req => {
    const matchData = calculateMatchScore(donation, req);
    // Return a plain object representation to inject matchData safely
    return {
      ...(req.toObject ? req.toObject() : req),
      matchData
    };
  });

  return ranked.sort((a, b) => b.matchData.score - a.matchData.score);
};

/**
 * Returns the best eligible request for automatic assignment.
 */
const getBestEligibleRequest = (donation, requests) => {
  if (!requests || requests.length === 0) return null;
  const ranked = rankRequests(donation, requests);
  return ranked[0]; // Highest score
};

module.exports = {
  MATCHING_CONFIG,
  calculateMatchScore,
  rankRequests,
  getBestEligibleRequest
};

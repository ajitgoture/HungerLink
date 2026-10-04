const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateCoordinates,
  toGeoPoint,
  sanitizeGeoPointField,
} = require('../utils/locationValidator');

test('valid GeoJSON conversion stores [lng, lat]', () => {
  const point = toGeoPoint(15.8213726, 74.4929024);
  assert.deepEqual(point, {
    type: 'Point',
    coordinates: [74.4929024, 15.8213726],
  });
});

test('invalid latitude is rejected', () => {
  assert.equal(toGeoPoint(91, 74.4929024), undefined);
});

test('invalid longitude is rejected', () => {
  assert.equal(toGeoPoint(15.8213726, 181), undefined);
});

test('null latitude and longitude are rejected', () => {
  assert.equal(toGeoPoint(null, 74.4929024), undefined);
  assert.equal(toGeoPoint(15.8213726, null), undefined);
});

test('undefined live location does not create invalid GeoJSON', () => {
  assert.equal(sanitizeGeoPointField({ lat: null, lng: null, heading: 0, accuracy: 0, timestamp: null }), undefined);
  assert.equal(sanitizeGeoPointField({ lat: undefined, lng: undefined }), undefined);
});

test('mixed legacy live location is normalized only when valid', () => {
  assert.deepEqual(sanitizeGeoPointField({ lat: 15.8213726, lng: 74.4929024 }), {
    type: 'Point',
    coordinates: [74.4929024, 15.8213726],
  });
  assert.equal(sanitizeGeoPointField({ lat: null, lng: 74.4929024 }), undefined);
});

test('real GPS coordinates are accepted by validator', () => {
  assert.equal(validateCoordinates(15.8213726, 74.4929024), true);
});

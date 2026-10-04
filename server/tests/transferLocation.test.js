const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateDistanceMeters,
  classifyProximity,
  getMovingRole,
  recordParticipantArrival,
} = require('../utils/transferLocation');

test('calculates geographic distance and rejects unavailable coordinates', () => {
  const distance = calculateDistanceMeters(37.7749, -122.4194, 37.7752, -122.4194);
  assert.ok(distance > 30 && distance < 35);
  assert.equal(calculateDistanceMeters(null, null, 37.7752, -122.4194), null);
});

test('classifies proximity at configured milestones', () => {
  assert.equal(classifyProximity(501), 'NORMAL');
  assert.equal(classifyProximity(500), 'APPROACHING');
  assert.equal(classifyProximity(100), 'NEAR');
  assert.equal(classifyProximity(30), 'HANDOVER_ZONE');
  assert.equal(classifyProximity(null), 'UNAVAILABLE');
});

test('assigns the moving participant for both transfer modes', () => {
  assert.equal(getMovingRole('DELIVERY'), 'DONOR');
  assert.equal(getMovingRole('PICKUP'), 'RECEIVER');
  assert.equal(getMovingRole('UNKNOWN'), null);
});

test('requires both explicit participant arrivals', () => {
  const session = { donorArrived: false, receiverArrived: false };
  const arrivalTime = new Date('2026-09-30T12:00:00.000Z');

  assert.equal(recordParticipantArrival(session, 'DONOR', arrivalTime), false);
  assert.equal(session.donorArrivedAt, arrivalTime);
  assert.equal(session.receiverArrived, false);
  assert.equal(recordParticipantArrival(session, 'RECEIVER', arrivalTime), true);
});
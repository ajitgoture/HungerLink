const test = require('node:test');
const assert = require('node:assert/strict');
const { TRANSFER_STATES, assertValidTransition } = require('../utils/transferState');

test('accepts the canonical donor pickup flow', () => {
  assert.doesNotThrow(() => {
    assertValidTransition(TRANSFER_STATES.ACCEPTED, TRANSFER_STATES.READY_FOR_PICKUP);
    assertValidTransition(TRANSFER_STATES.READY_FOR_PICKUP, TRANSFER_STATES.TRACKING);
    assertValidTransition(TRANSFER_STATES.TRACKING, TRANSFER_STATES.ARRIVED);
    assertValidTransition(TRANSFER_STATES.ARRIVED, TRANSFER_STATES.HANDOVER_READY);
    assertValidTransition(TRANSFER_STATES.HANDOVER_READY, TRANSFER_STATES.QR_VERIFIED);
    assertValidTransition(TRANSFER_STATES.QR_VERIFIED, TRANSFER_STATES.COMPLETED);
  });
});

test('allows donor handover directly from ready-for-pickup without arrival', () => {
  assert.doesNotThrow(() => {
    assertValidTransition(TRANSFER_STATES.READY_FOR_PICKUP, TRANSFER_STATES.HANDOVER_READY);
  });
});

test('allows donor handover directly from ready-for-delivery without arrival', () => {
  assert.doesNotThrow(() => {
    assertValidTransition(TRANSFER_STATES.READY_FOR_DELIVERY, TRANSFER_STATES.HANDOVER_READY);
  });
});

test('rejects an invalid transition out of the canonical flow', () => {
  assert.throws(() => {
    assertValidTransition(TRANSFER_STATES.ACCEPTED, TRANSFER_STATES.COMPLETED);
  }, /Invalid state transition/);
});

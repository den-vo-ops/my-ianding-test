import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMagneticOffset } from '../js/magnetic.js';

test('returns zero offset when mouse is at element center', () => {
  const rect = { left: 0, top: 0, width: 100, height: 40 };
  const result = computeMagneticOffset(50, 20, rect);
  assert.deepEqual(result, { x: 0, y: 0 });
});

test('scales offset by the strength factor', () => {
  const rect = { left: 0, top: 0, width: 100, height: 40 };
  const result = computeMagneticOffset(100, 20, rect, 0.5);
  assert.deepEqual(result, { x: 25, y: 0 });
});

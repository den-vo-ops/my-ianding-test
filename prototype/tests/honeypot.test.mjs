import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLikelyBot } from '../js/honeypot.js';

test('flags submission as bot when the honeypot field is filled', () => {
  assert.equal(isLikelyBot({ website: 'http://spam.example' }), true);
});

test('treats an empty honeypot field as human', () => {
  assert.equal(isLikelyBot({ website: '' }), false);
});

test('treats a missing honeypot field as human', () => {
  assert.equal(isLikelyBot({}), false);
});

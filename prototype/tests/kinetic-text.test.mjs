import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitWords } from '../js/kinetic-text.js';

test('wraps each word in a kinetic-word span', () => {
  const result = splitWords('Hello world');
  assert.equal(
    result,
    '<span class="kinetic-word">Hello</span> <span class="kinetic-word">world</span>'
  );
});

test('collapses repeated whitespace between words', () => {
  const result = splitWords('Hello   world');
  assert.equal(
    result,
    '<span class="kinetic-word">Hello</span> <span class="kinetic-word">world</span>'
  );
});

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSeconds, positionAfter, splitDuration } from './time.ts';

const ex = (...durations: number[]) => durations.map((duration) => ({ duration }));

describe('positionAfter', () => {
  test('stays on the current exercise partway through it', () => {
    assert.deepEqual(positionAfter(ex(30, 30), 0, 12_345), { index: 0, elapsedMs: 12_345 });
  });

  test('moves on exactly at the boundary', () => {
    assert.deepEqual(positionAfter(ex(30, 30), 0, 29_999), { index: 0, elapsedMs: 29_999 });
    assert.deepEqual(positionAfter(ex(30, 30), 0, 30_000), { index: 1, elapsedMs: 0 });
  });

  test('catches up across several exercises, carrying the leftover time', () => {
    // 10 + 20 + 5 = 35s fully used, 2.5s into the fourth exercise
    assert.deepEqual(positionAfter(ex(10, 20, 5, 30), 0, 37_500), { index: 3, elapsedMs: 2_500 });
  });

  test('starts counting from the given exercise', () => {
    assert.deepEqual(positionAfter(ex(10, 20, 5), 1, 21_000), { index: 2, elapsedMs: 1_000 });
  });

  test('returns null once the whole sequence is over', () => {
    assert.equal(positionAfter(ex(10, 10), 0, 20_000), null);
    assert.equal(positionAfter(ex(10, 10), 1, 60_000), null);
    assert.equal(positionAfter([], 0, 0), null);
  });

  test('treats a clock that went backwards as no time passed', () => {
    assert.deepEqual(positionAfter(ex(10), 0, -5_000), { index: 0, elapsedMs: 0 });
  });
});

describe('splitDuration', () => {
  test('splits evenly and gives the remainder to the last exercise', () => {
    assert.deepEqual(splitDuration(90, 3), [30, 30, 30]);
    assert.deepEqual(splitDuration(10, 3), [3, 3, 4]);
  });

  test('never gives an exercise 0 seconds when the total is too short', () => {
    assert.deepEqual(splitDuration(2, 4), [1, 1, 1, 1]);
    assert.deepEqual(splitDuration(0, 1), [1]);
  });

  test('keeps the total when it is long enough', () => {
    const parts = splitDuration(301, 7);
    assert.equal(parts.length, 7);
    assert.equal(
      parts.reduce((a, b) => a + b, 0),
      301
    );
    assert.ok(parts.every((p) => p >= 1));
  });
});

describe('formatSeconds', () => {
  test('pads seconds to two digits', () => {
    assert.equal(formatSeconds(0), '0:00');
    assert.equal(formatSeconds(65), '1:05');
    assert.equal(formatSeconds(600), '10:00');
  });
});

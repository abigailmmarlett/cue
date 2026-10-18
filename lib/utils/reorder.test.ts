import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { hoverSlot, slotsOf, slotsWithMove } from './reorder.ts';

const ids = ['a', 'b', 'c', 'd'];

test('slotsOf numbers items from the top', () => {
  assert.deepEqual(slotsOf(ids), { a: 0, b: 1, c: 2, d: 3 });
  assert.deepEqual(slotsOf([]), {});
});

describe('hoverSlot', () => {
  test('rounds to the nearest slot', () => {
    assert.equal(hoverSlot(0, 40, 88, 4), 0);
    assert.equal(hoverSlot(0, 50, 88, 4), 1);
    assert.equal(hoverSlot(2, -100, 88, 4), 1);
  });

  test('stays within the list when dragged past either end', () => {
    assert.equal(hoverSlot(1, -1000, 88, 4), 0);
    assert.equal(hoverSlot(1, 1000, 88, 4), 3);
  });
});

describe('slotsWithMove', () => {
  test('moving down shifts the items it passes up one', () => {
    assert.deepEqual(slotsWithMove(ids, 'a', 2), { b: 0, c: 1, a: 2, d: 3 });
  });

  test('moving up shifts the items it passes down one', () => {
    assert.deepEqual(slotsWithMove(ids, 'd', 0), { d: 0, a: 1, b: 2, c: 3 });
  });

  test('matches the order the list ends up in, so a drop moves nothing on screen', () => {
    // What the builders' onReorder(from, to) does to their arrays.
    const reordered = [...ids];
    const [moved] = reordered.splice(1, 1);
    reordered.splice(3, 0, moved);
    assert.deepEqual(slotsWithMove(ids, 'b', 3), slotsOf(reordered));
  });
});

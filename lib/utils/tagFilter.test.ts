import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasAllTags } from './tagFilter.ts';

const tag = (tagValueId: string) => ({ tagValueId });

test('hasAllTags matches only items that have every selected tag', () => {
  const tags = [tag('legs'), tag('easy')];
  assert.equal(hasAllTags(tags, []), true, 'no filter matches everything');
  assert.equal(hasAllTags(tags, [tag('legs')]), true);
  assert.equal(hasAllTags(tags, [tag('legs'), tag('easy')]), true);
  assert.equal(hasAllTags(tags, [tag('legs'), tag('arms')]), false, 'one missing tag excludes it');
  assert.equal(hasAllTags([], [tag('legs')]), false);
});

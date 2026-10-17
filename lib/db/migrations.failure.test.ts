import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { UNVERSIONED_SCHEMA } from '../../test/fixtures/schemas.ts';
import { getDb } from './client.ts';
import { runMigrations, SCHEMA_VERSION } from './schema.ts';

const db = getDb();
const version = () => db.getFirstSync<{ user_version: number }>('PRAGMA user_version;')!.user_version;
const categoryIds = () =>
  db
    .getAllSync<{ id: string }>(`SELECT id FROM tag_categories ORDER BY id;`)
    .map((c) => c.id)
    .join(',');

before(() => {
  db.execSync(UNVERSIONED_SCHEMA);
  db.execSync(`
    INSERT INTO tag_categories VALUES ('dupA', 'Level', 1), ('dupB', 'level', 2);
    -- Migration 3 merges the duplicates above, then fails creating an index that already exists.
    CREATE INDEX tag_values_category_label ON tag_values(category_id);
  `);
});

test('a migration that fails partway is undone and its version is not bumped', () => {
  assert.throws(() => runMigrations(), /already exists/);
  assert.equal(version(), 2, 'migrations 1 and 2 are kept');
  assert.equal(categoryIds(), 'dupA,dupB', 'the merge migration 3 had done is undone');
});

test('the next launch retries from the last good version', () => {
  db.execSync('DROP INDEX tag_values_category_label;');
  runMigrations();
  assert.equal(version(), SCHEMA_VERSION);
  assert.equal(categoryIds(), 'dupA');
});

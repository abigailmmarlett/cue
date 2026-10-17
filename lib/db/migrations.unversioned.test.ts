import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { UNVERSIONED_SCHEMA } from '../../test/fixtures/schemas.ts';
import { getDb } from './client.ts';
import { runMigrations, SCHEMA_VERSION } from './schema.ts';
import { getAllSequences } from './sequences.ts';
import { getSectionsBySequenceId } from './sections.ts';
import { createExercise, getExercisesBySequenceId } from './exercises.ts';
import { createTagValue, getTagsForSequenceExercises } from './tags.ts';

const db = getDb();
let sequencesBefore = '';

before(() => {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(UNVERSIONED_SCHEMA);
  db.execSync(`
    INSERT INTO sequences (id, name, created_at, updated_at, is_favorited) VALUES ('s1', 'Barre', 1, 1, 1);
    INSERT INTO sections (id, sequence_id, name, order_index, created_at) VALUES ('w', 's1', 'Warmup', 0, 1), ('m', 's1', 'Main', 1, 1);
    INSERT INTO library_exercises (id, name, created_at, updated_at, load_base, is_bilateral) VALUES ('L', 'Lunge', 1, 1, '["i1"]', 1);
    INSERT INTO exercises
      (id, sequence_id, section_id, name, duration, order_index, notes, created_at, library_exercise_id, load_base, variation, variation_sets, side)
    VALUES
      ('a', 's1', 'w', 'Lunge', 30, 0, NULL, 1, 'L', NULL, NULL, '[{"instruction":"pulse","atSeconds":10}]', 'left'),
      ('b', 's1', 'm', 'Orphan', 45, 0, 'library entry was deleted', 1, NULL, '["i2"]', 'tuck', NULL, 'right'),
      ('c', 's1', 'm', 'Plank', 60, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL);
    INSERT INTO tag_categories VALUES ('c1', 'Area', 1);
    INSERT INTO tag_values VALUES ('t1', 'c1', 'Legs', 1);
    INSERT INTO library_exercise_tags VALUES ('L', 't1');
  `);
  sequencesBefore = JSON.stringify(getAllSequences());
  runMigrations();
});

test('upgrades a database from before numbered migrations', () => {
  assert.equal(db.getFirstSync<{ user_version: number }>('PRAGMA user_version;')!.user_version, SCHEMA_VERSION);
});

test('sequences, sections and exercises read back unchanged', () => {
  assert.equal(JSON.stringify(getAllSequences()), sequencesBefore);
  assert.deepEqual(
    getSectionsBySequenceId('s1').map((s) => s.name),
    ['Warmup', 'Main']
  );
  const [lunge, orphan] = getExercisesBySequenceId('s1');
  assert.equal(lunge.load_base, '["i1"]', 'a linked exercise still uses the library load');
  assert.equal(lunge.variation_sets, '[{"instruction":"pulse","atSeconds":10}]');
  assert.equal(orphan.load_base, '["i2"]');
  assert.equal(orphan.variation, 'tuck');
});

test('left/right flag: from the library when linked, recovered for an unlinked exercise with a side', () => {
  assert.deepEqual(
    getExercisesBySequenceId('s1').map((e) => e.is_bilateral),
    [1, 1, 0]
  );
});

test('linked exercises still show their library tags', () => {
  assert.equal(getTagsForSequenceExercises('s1').get('a')![0].label, 'Legs');
});

test('the app can write to it afterwards', () => {
  createExercise('s1', 'm', 'New', 20);
  assert.equal(createTagValue('c1', 'legs').id, 't1', 'finds the existing tag ignoring case');
  assert.deepEqual(db.getAllSync('PRAGMA foreign_key_check;'), []);
});

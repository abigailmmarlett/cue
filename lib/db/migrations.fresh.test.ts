import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from './client.ts';
import { DatabaseTooNewError, runMigrations, SCHEMA_VERSION } from './schema.ts';
import { createSequence, duplicateSequence } from './sequences.ts';
import { createSection } from './sections.ts';
import { createExercise, getExercisesBySequenceId } from './exercises.ts';
import {
  createLibraryExercise,
  deleteLibraryExercise,
  setLibraryExerciseTags,
  updateLibraryExerciseBilateral,
} from './libraryExercises.ts';
import {
  createTagCategory,
  createTagValue,
  getTagsForExercise,
  getTagsForSequenceExercises,
  setExerciseTags,
  updateTagCategory,
  updateTagValue,
} from './tags.ts';

const db = getDb();
const version = () => db.getFirstSync<{ user_version: number }>('PRAGMA user_version;')!.user_version;
const names = (type: 'table' | 'index') =>
  db
    .getAllSync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
      [type]
    )
    .map((r) => r.name);

before(() => runMigrations());

test('a fresh install reaches the latest version with every table and index', () => {
  assert.equal(version(), SCHEMA_VERSION);
  assert.deepEqual(names('table'), [
    'exercise_tags',
    'exercises',
    'library_exercise_tags',
    'library_exercises',
    'load_icons',
    'preferences',
    'sections',
    'sequence_tags',
    'sequences',
    'tag_categories',
    'tag_values',
  ]);
  assert.deepEqual(names('index'), [
    'exercise_tags_tag_value_id',
    'exercises_library_exercise_id',
    'exercises_section_id',
    'exercises_sequence_id',
    'library_exercise_tags_tag_value_id',
    'sections_sequence_id',
    'sequence_tags_tag_value_id',
    'tag_categories_name',
    'tag_values_category_label',
  ]);
});

test('running the migrations again changes nothing', () => {
  runMigrations();
  assert.equal(version(), SCHEMA_VERSION);
});

test('foreign keys are enforced', () => {
  assert.equal(db.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys;')!.foreign_keys, 1);
});

test('a database from a newer version of Cue is refused and left untouched', () => {
  db.execSync('PRAGMA user_version = 99;');
  assert.throws(() => runMigrations(), DatabaseTooNewError);
  assert.equal(version(), 99);
  db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
});

test('a failing migration rolls back together with its version bump', () => {
  // runMigrations relies on SQLite undoing a PRAGMA user_version change on rollback.
  assert.throws(() =>
    db.withTransactionSync(() => {
      db.execSync('PRAGMA user_version = 42;');
      db.execSync('CREATE TABLE half_done (x);');
      throw new Error('boom');
    })
  );
  assert.equal(version(), SCHEMA_VERSION);
  assert.equal(names('table').includes('half_done'), false);
});

test('tag names are unique ignoring case: creating reuses, renaming refuses a clash', () => {
  const level = createTagCategory('Level');
  assert.equal(createTagCategory('level').id, level.id);
  const focus = createTagCategory('Focus');
  assert.equal(updateTagCategory(focus.id, 'LEVEL'), false);
  assert.equal(updateTagCategory(level.id, 'LEVEL'), true, 'changing only its own case is fine');

  const hard = createTagValue(level.id, 'Hard');
  assert.equal(createTagValue(level.id, 'hard').id, hard.id);
  const easy = createTagValue(level.id, 'Easy');
  assert.equal(updateTagValue(easy.id, 'HARD'), false);
  assert.notEqual(createTagValue(focus.id, 'Hard').id, hard.id, 'the same label in another category is fine');
  assert.throws(
    () => db.runSync(`INSERT INTO tag_categories (id, name, created_at) VALUES ('x', 'level', 0);`),
    /UNIQUE/
  );
});

test('loading all of a sequence’s tags at once matches loading them one exercise at a time', () => {
  const lib = createLibraryExercise('Row');
  const area = createTagCategory('Area');
  const back = createTagValue(area.id, 'Back');
  const arms = createTagValue(area.id, 'Arms');
  setLibraryExerciseTags(lib.id, [back.id]);
  const seq = createSequence('Bulk');
  const sec = createSection(seq.id, 'Main');
  const own = createExercise(seq.id, sec.id, 'Own', 30, undefined, lib.id);
  setExerciseTags(own.id, [arms.id]);
  const inherits = createExercise(seq.id, sec.id, 'Inherits', 30, undefined, lib.id);
  const plain = createExercise(seq.id, sec.id, 'Plain', 30);

  const bulk = getTagsForSequenceExercises(seq.id);
  // node:sqlite rows have no prototype, so compare plain copies.
  const plainCopy = (value: unknown) => JSON.parse(JSON.stringify(value));
  for (const ex of [own, inherits, plain]) {
    assert.deepEqual(plainCopy(bulk.get(ex.id) ?? []), plainCopy(getTagsForExercise(ex.id)), ex.name);
  }
  assert.equal(bulk.get(inherits.id)![0].label, 'Back');
});

test('left/right flag: linked exercises follow the library; deleting or duplicating keeps it', () => {
  const lib = createLibraryExercise('Lunge');
  updateLibraryExerciseBilateral(lib.id, true);
  const seq = createSequence('Sides');
  const sec = createSection(seq.id, 'Main');
  createExercise(seq.id, sec.id, 'Lunge', 30, undefined, lib.id, null, 'left');
  createExercise(seq.id, sec.id, 'Custom', 30, undefined, null, null, 'right', null, undefined, true);
  createExercise(seq.id, sec.id, 'Plain', 30);
  const flags = (id: string) => getExercisesBySequenceId(id).map((e) => [e.name, e.is_bilateral]);
  assert.deepEqual(flags(seq.id), [
    ['Lunge', 1],
    ['Custom', 1],
    ['Plain', 0],
  ]);

  updateLibraryExerciseBilateral(lib.id, false);
  assert.equal(getExercisesBySequenceId(seq.id)[0].is_bilateral, 0, 'follows the library while linked');
  updateLibraryExerciseBilateral(lib.id, true);
  deleteLibraryExercise(lib.id);
  assert.deepEqual(flags(seq.id), [
    ['Lunge', 1],
    ['Custom', 1],
    ['Plain', 0],
  ]);
  assert.deepEqual(flags(duplicateSequence(seq.id).id), flags(seq.id));
});

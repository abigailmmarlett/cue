import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { ORIGINAL_SCHEMA } from '../../test/fixtures/schemas.ts';
import { getDb } from './client.ts';
import { runMigrations, SCHEMA_VERSION } from './schema.ts';
import { getSectionsBySequenceId } from './sections.ts';
import { getExercisesBySequenceId } from './exercises.ts';
import { getOwnTagsForExercise, getTagsForSequence } from './tags.ts';

const db = getDb();
const labels = (rows: { categoryName: string; label: string }[]) =>
  rows.map((t) => `${t.categoryName}:${t.label}`).sort();

before(() => {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(ORIGINAL_SCHEMA);
  db.execSync(`
    INSERT INTO sequences VALUES ('s1', 'Mon', 1, 1), ('s2', 'Tue', 2, 2);
    INSERT INTO exercises VALUES
      ('e1', 's1', 'Squat', 30, 0, NULL, 1), ('e2', 's1', 'Lunge', 40, 1, 'slow', 1), ('e3', 's2', 'Plank', 60, 0, NULL, 2);
    -- "Level" three times by case (one with a trailing space), with duplicate values inside.
    INSERT INTO tag_categories VALUES ('cA', 'Level', 10), ('cB', 'level', 20), ('cC', 'LEVEL ', 30), ('cD', 'Focus', 5);
    INSERT INTO tag_values VALUES
      ('vA1', 'cA', 'Hard', 10), ('vB1', 'cB', 'hard', 20), ('vB2', 'cB', 'Easy', 21), ('vA2', 'cA', 'easy', 22),
      ('vD1', 'cD', 'Core', 5);
    -- e1 has both copies of "Hard", which must merge into one tag; e2 only the duplicate.
    INSERT INTO exercise_tags VALUES ('e1', 'vA1'), ('e1', 'vB1'), ('e2', 'vB1'), ('e3', 'vA2'), ('e3', 'vD1');
    INSERT INTO sequence_tags VALUES ('s1', 'vB1'), ('s2', 'vB2');
  `);
  runMigrations();
});

test('upgrades the original layout to the latest version', () => {
  assert.equal(db.getFirstSync<{ user_version: number }>('PRAGMA user_version;')!.user_version, SCHEMA_VERSION);
  const columns = db.getAllSync<{ name: string }>('PRAGMA table_info(exercises);').map((c) => c.name);
  for (const column of ['section_id', 'library_exercise_id', 'load_base', 'variation_sets', 'side', 'is_bilateral']) {
    assert.ok(columns.includes(column), column);
  }
});

test('puts existing exercises into a "Main" section, in order', () => {
  assert.deepEqual(
    getSectionsBySequenceId('s1').map((s) => s.name),
    ['Main']
  );
  const exercises = getExercisesBySequenceId('s1');
  assert.deepEqual(
    exercises.map((e) => e.name),
    ['Squat', 'Lunge']
  );
  assert.equal(exercises[1].notes, 'slow');
});

test('merges duplicate tag categories and values into the oldest copy', () => {
  const categories = db.getAllSync<{ id: string }>('SELECT id FROM tag_categories;').map((c) => c.id);
  // "level" merged into "Level"; "LEVEL " has a trailing space, so it's a different name.
  assert.deepEqual(categories.sort(), ['cA', 'cC', 'cD']);
  const values = db.getAllSync<{ id: string }>(
    `SELECT id FROM tag_values WHERE category_id = 'cA' ORDER BY created_at;`
  );
  // Hard: vA1 (10) is older than vB1 (20). Easy: vB2 (21, moved in from "level") is older than vA2 (22).
  assert.deepEqual(
    values.map((v) => v.id),
    ['vA1', 'vB2']
  );
});

test('every exercise and sequence keeps its tags, with no duplicates', () => {
  assert.deepEqual(labels(getOwnTagsForExercise('e1')), ['Level:Hard']);
  assert.deepEqual(labels(getOwnTagsForExercise('e2')), ['Level:Hard']);
  assert.deepEqual(labels(getOwnTagsForExercise('e3')), ['Focus:Core', 'Level:Easy']);
  assert.deepEqual(labels(getTagsForSequence('s1')), ['Level:Hard']);
  assert.deepEqual(labels(getTagsForSequence('s2')), ['Level:Easy']);
  assert.equal(db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM exercise_tags;')!.n, 4);
});

test('foreign keys are consistent afterwards', () => {
  assert.deepEqual(db.getAllSync('PRAGMA foreign_key_check;'), []);
});

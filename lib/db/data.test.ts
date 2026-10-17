import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { getDb, transaction } from './client.ts';
import { runMigrations } from './schema.ts';
import { createSequence, duplicateSequence, getAllSequences } from './sequences.ts';
import { createSection, getSectionsBySequenceId } from './sections.ts';
import { createExercise, getExercisesBySequenceId, parseVariationSets } from './exercises.ts';
import {
  createTagCategory,
  createTagValue,
  getOwnTagsForExercise,
  getTagsForSequence,
  setExerciseTags,
  setSequenceTags,
} from './tags.ts';
import {
  addUnlinkedToLibrary,
  createLibraryExercise,
  deleteLibraryExercise,
  getLibraryExercise,
  updateLibraryExerciseLoad,
} from './libraryExercises.ts';
import { parseLoad } from './loadIcons.ts';

const db = getDb();

before(() => runMigrations());

test('a transaction rolls back every write when it throws', () => {
  const count = getAllSequences().length;
  assert.throws(() =>
    transaction(() => {
      createSequence('A');
      createSequence('B');
      throw new Error('boom');
    })
  );
  assert.equal(getAllSequences().length, count);
});

test('a nested transaction joins the outer one and rolls back with it', () => {
  const count = getAllSequences().length;
  assert.throws(() =>
    transaction(() => {
      createSequence('outer');
      transaction(() => createSequence('inner'));
      throw new Error('boom');
    })
  );
  assert.equal(getAllSequences().length, count);
  assert.equal(db.isInTransactionSync(), false);
});

test('tagging a missing exercise fails instead of leaving a stray row', () => {
  const tag = createTagValue(createTagCategory('Level').id, 'Hard');
  assert.throws(() => setExerciseTags('not-a-real-exercise-id', [tag.id]));
});

test('setExerciseTags keeps the old tags if saving the new ones fails', () => {
  const seq = createSequence('Tags');
  const sec = createSection(seq.id, 'Main');
  const core = createTagValue(createTagCategory('Focus').id, 'Core');
  const ex = createExercise(seq.id, sec.id, 'Plank', 45);
  setExerciseTags(ex.id, [core.id]);
  assert.throws(() => setExerciseTags(ex.id, ['missing-tag-value']));
  assert.deepEqual(
    getOwnTagsForExercise(ex.id).map((t) => t.tagValueId),
    [core.id]
  );
});

test('duplicating a sequence copies loads, variations, side, library link and tags', () => {
  const lib = createLibraryExercise('Lunge');
  const seq = createSequence('Original');
  const sec = createSection(seq.id, 'Warmup');
  const legs = createTagValue(createTagCategory('Body').id, 'Legs');
  const ex = createExercise(seq.id, sec.id, 'Lunge', 40, 'knee over toe', lib.id, 'pulse', 'left', [
    { instruction: 'hold', atSeconds: 20 },
  ]);
  db.runSync('UPDATE exercises SET load_base = ? WHERE id = ?;', ['["icon1"]', ex.id]);
  setExerciseTags(ex.id, [legs.id]);
  setSequenceTags(seq.id, [legs.id]);

  const copy = duplicateSequence(seq.id);
  const [original] = getExercisesBySequenceId(seq.id);
  const [duplicate] = getExercisesBySequenceId(copy.id);
  assert.notEqual(duplicate.id, original.id);
  const fields = [
    'name',
    'duration',
    'notes',
    'library_exercise_id',
    'load_base',
    'variation',
    'variation_sets',
    'side',
    'order_index',
  ] as const;
  for (const field of fields) assert.deepEqual(duplicate[field], original[field], field);
  assert.equal(getSectionsBySequenceId(copy.id)[0].name, 'Warmup');
  assert.deepEqual(
    getOwnTagsForExercise(duplicate.id).map((t) => t.tagValueId),
    [legs.id]
  );
  assert.deepEqual(
    getTagsForSequence(copy.id).map((t) => t.tagValueId),
    [legs.id]
  );
});

test('deleting a library exercise unlinks its exercises and keeps what they showed', () => {
  const lib = createLibraryExercise('Row');
  updateLibraryExerciseLoad(lib.id, null, '["x"]', null);
  const seq = createSequence('Library');
  const sec = createSection(seq.id, 'Main');
  createExercise(seq.id, sec.id, 'Row', 30, undefined, lib.id);
  deleteLibraryExercise(lib.id);
  const [row] = getExercisesBySequenceId(seq.id);
  assert.equal(row.library_exercise_id, null);
  assert.equal(row.load_base, '["x"]');
});

test('saving unlinked exercises to the library carries their left/right flag and tags', () => {
  const tag = createTagValue(createTagCategory('Area').id, 'Glutes');
  const existing = createLibraryExercise('Bridge');
  const exercise = (name: string, isBilateral: boolean, libraryExerciseId: string | null = null) => ({
    id: name,
    name,
    libraryExerciseId,
    tagValueIds: [tag.id],
    isBilateral,
  });
  const [section] = addUnlinkedToLibrary([
    {
      name: 'Main',
      exercises: [
        exercise('Side lunge', true),
        exercise('Squat', false),
        exercise('Bridge', true, existing.id),
        exercise('  ', true),
      ],
    },
  ]);
  const [sideLunge, squat, bridge, blank] = section.exercises;

  const sideLungeEntry = getLibraryExercise(sideLunge.libraryExerciseId!)!;
  assert.equal(sideLungeEntry.name, 'Side lunge');
  assert.equal(sideLungeEntry.is_bilateral, 1);
  assert.deepEqual(
    sideLungeEntry.tags.map((t) => t.tagValueId),
    [tag.id],
    'its tags move to the library entry'
  );
  assert.deepEqual(sideLunge.tagValueIds, []);
  assert.equal(getLibraryExercise(squat.libraryExerciseId!)!.is_bilateral, 0);
  assert.equal(bridge.libraryExerciseId, existing.id, 'already linked: left alone');
  assert.equal(blank.libraryExerciseId, null, 'no name: left alone');
});

test('stored variation sets and loads that are corrupt read as empty', () => {
  assert.equal(parseVariationSets('{oops'), null);
  assert.equal(parseVariationSets('{"a":1}'), null);
  assert.equal(parseVariationSets(null), null);
  assert.deepEqual(parseVariationSets('[{"instruction":"x","atSeconds":5},{"bad":true}]'), [
    { instruction: 'x', atSeconds: 5 },
  ]);
  assert.equal(parseLoad('{oops'), null);
  assert.equal(parseLoad('{"a":1}'), null);
  assert.deepEqual(parseLoad('["a", 2, "b"]'), ['a', 'b']);
});

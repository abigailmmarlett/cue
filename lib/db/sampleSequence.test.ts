import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from './client.ts';
import { runMigrations } from './schema.ts';
import { deleteSequence, getAllSequences } from './sequences.ts';
import { getAllLibraryExercises } from './libraryExercises.ts';
import { loadSequenceDraft } from './sequenceDraft.ts';
import { addSampleSequenceIfNew, SAMPLE_SEQUENCE_NAME } from './sampleSequence.ts';

const db = getDb();

before(() => runMigrations());

test('a new install gets a 5-minute sample sequence with its exercises in the library', () => {
  addSampleSequenceIfNew();

  const [sample] = getAllSequences();
  assert.equal(sample.name, SAMPLE_SEQUENCE_NAME);
  assert.equal(sample.total_duration, 300);

  const draft = loadSequenceDraft(sample.id)!;
  assert.deepEqual(
    draft.sections.map((s) => s.name),
    ['Warm-up', 'Core', 'Cool-down']
  );
  assert.deepEqual(
    draft.tags.map((t) => `${t.categoryName}: ${t.label}`),
    ['Level: Beginner', 'Style: Pilates']
  );

  const exercises = draft.sections.flatMap((s) => s.exercises);
  assert.ok(exercises.every((e) => e.libraryExerciseId));
  // The two sides share one library entry, which is marked left/right.
  const sides = exercises.filter((e) => e.side);
  assert.deepEqual(
    sides.map((e) => e.side),
    ['left', 'right']
  );
  assert.equal(sides[0].libraryExerciseId, sides[1].libraryExerciseId);
  assert.ok(sides.every((e) => e.isBilateral));
  assert.equal(getAllLibraryExercises().length, new Set(exercises.map((e) => e.name)).size);
});

test('the sample is added only once, even after it is deleted', () => {
  addSampleSequenceIfNew();
  assert.equal(getAllSequences().length, 1);

  deleteSequence(getAllSequences()[0].id);
  addSampleSequenceIfNew();
  assert.equal(getAllSequences().length, 0);
});

test('someone who already has sequences never gets the sample', () => {
  // As if they'd used Cue before the sample existed.
  db.runSync(`DELETE FROM preferences WHERE key = 'sampleSequenceAdded';`);
  db.runSync(`INSERT INTO sequences (id, name, created_at, updated_at) VALUES ('mine', 'Mine', 1, 1);`);

  addSampleSequenceIfNew();
  assert.deepEqual(
    getAllSequences().map((s) => s.name),
    ['Mine']
  );
  // And it won't be added later if they delete everything.
  deleteSequence('mine');
  addSampleSequenceIfNew();
  assert.equal(getAllSequences().length, 0);
});

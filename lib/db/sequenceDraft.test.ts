import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from './client.ts';
import { runMigrations } from './schema.ts';
import { getAllSequences } from './sequences.ts';
import { getExercisesBySequenceId } from './exercises.ts';
import { createTagCategory, createTagValue, getAllTagValuesWithCategory } from './tags.ts';
import { createLibraryExercise, getLibraryExercise, updateLibraryExerciseLoad } from './libraryExercises.ts';
import {
  copySectionToDraft,
  loadSequenceDraft,
  newSequenceDraft,
  saveSequenceDraft,
  type DraftExercise,
  type SequenceDraft,
} from './sequenceDraft.ts';

const db = getDb();

before(() => runMigrations());

// node:sqlite rows have no prototype, which deepEqual counts as a difference, so compare plain copies.
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

let counter = 0;
function exercise(name: string, fields: Partial<DraftExercise> = {}): DraftExercise {
  return {
    id: `ex-${++counter}`,
    name,
    duration: 30,
    notes: null,
    tagValueIds: [],
    tags: [],
    libraryExerciseId: null,
    loadModified: null,
    loadBase: null,
    loadAmplified: null,
    variation: null,
    variationSets: null,
    isBilateral: false,
    side: null,
    ...fields,
  };
}

function tag(label: string) {
  const value = createTagValue(createTagCategory(`Category ${label}`).id, label);
  const withCategory = getAllTagValuesWithCategory().find((t) => t.id === value.id)!;
  return { tagValueId: value.id, categoryName: withCategory.categoryName, label };
}

test('a new sequence saves and loads back as it was drafted', () => {
  const legs = tag('Legs');
  const draft: SequenceDraft = {
    ...newSequenceDraft(),
    name: '  Barre  ',
    tags: [legs],
  };
  draft.sections[0].exercises.push(
    exercise('Plié', {
      duration: 45,
      notes: 'heels together',
      tagValueIds: [legs.tagValueId],
      tags: [legs],
      loadBase: ['icon-a', 'icon-b'],
      variationSets: [{ instruction: 'pulse', atSeconds: 20 }],
      isBilateral: true,
      side: 'left',
    }),
    exercise('Relevé')
  );
  draft.sections.push({ id: 'cooldown', name: 'Cooldown', exercises: [exercise('Stretch', { duration: 60 })] });

  const id = saveSequenceDraft(null, draft, false);
  const loaded = loadSequenceDraft(id);

  assert.equal(loaded?.name, 'Barre');
  assert.deepEqual(plain(loaded?.tags), [legs]);
  assert.deepEqual(plain(loaded?.sections), draft.sections);
});

test('saving an edit removes, reorders and renames to match the draft', () => {
  const draft = newSequenceDraft();
  const [a, b, c] = [exercise('A'), exercise('B'), exercise('C')];
  draft.sections[0].exercises.push(a, b, c);
  draft.sections.push({ id: 'extra', name: 'Extra', exercises: [exercise('D')] });
  const id = saveSequenceDraft(null, { ...draft, name: 'Before' }, false);

  const edited = loadSequenceDraft(id)!;
  edited.name = 'After';
  edited.sections = [{ ...edited.sections[0], name: 'Renamed', exercises: [c, a] }];
  assert.equal(saveSequenceDraft(id, edited, false), id);

  const loaded = loadSequenceDraft(id)!;
  assert.equal(loaded.name, 'After');
  assert.deepEqual(
    loaded.sections.map((s) => [s.name, s.exercises.map((e) => e.name)]),
    [['Renamed', ['C', 'A']]]
  );
  assert.deepEqual(
    getExercisesBySequenceId(id).map((e) => e.name),
    ['C', 'A']
  );
  assert.equal(getAllSequences().filter((s) => s.id === id).length, 1);
});

test('blank names save as placeholders', () => {
  const draft = { ...newSequenceDraft(), name: ' ' };
  draft.sections[0] = { ...draft.sections[0], name: '', exercises: [exercise('  ')] };
  const loaded = loadSequenceDraft(saveSequenceDraft(null, draft, false))!;
  assert.equal(loaded.name, 'Untitled Sequence');
  assert.equal(loaded.sections[0].name, 'Section');
  assert.equal(loaded.sections[0].exercises[0].name, 'Exercise');
});

test("a linked exercise stores only the loads that differ from its library entry's", () => {
  const lib = createLibraryExercise('Squat');
  updateLibraryExerciseLoad(lib.id, null, '["lib-base"]', '["lib-amp"]');
  const draft = newSequenceDraft();
  draft.sections[0].exercises.push(
    exercise('Squat', { libraryExerciseId: lib.id, loadBase: ['lib-base'], loadAmplified: ['own-amp'] })
  );
  const id = saveSequenceDraft(null, draft, false);

  const row = db.getFirstSync<{ load_base: string | null; load_amplified: string | null }>(
    'SELECT load_base, load_amplified FROM exercises WHERE sequence_id = ?;',
    [id]
  );
  assert.deepEqual(plain(row), { load_base: null, load_amplified: '["own-amp"]' });
  // The builder still shows the library's base load.
  assert.deepEqual(loadSequenceDraft(id)!.sections[0].exercises[0].loadBase, ['lib-base']);
});

test('with addToLibrary, unlinked exercises are added to the library and linked', () => {
  const draft = newSequenceDraft();
  draft.sections[0].exercises.push(exercise('Brand new move', { isBilateral: true }));
  const id = saveSequenceDraft(null, draft, true);

  const saved = loadSequenceDraft(id)!.sections[0].exercises[0];
  assert.ok(saved.libraryExerciseId);
  const entry = getLibraryExercise(saved.libraryExerciseId);
  assert.equal(entry?.name, 'Brand new move');
  assert.equal(entry?.is_bilateral, 1);
});

test('a failed save changes nothing', () => {
  const draft = newSequenceDraft();
  draft.sections[0].exercises.push(exercise('Keep me'));
  const id = saveSequenceDraft(null, { ...draft, name: 'Original' }, false);
  const before = loadSequenceDraft(id);
  const count = getAllSequences().length;

  const broken: SequenceDraft = {
    ...draft,
    name: 'Changed',
    sections: [{ ...draft.sections[0], exercises: [exercise('Bad tag', { tagValueIds: ['no-such-tag'] })] }],
  };
  assert.throws(() => saveSequenceDraft(id, broken, false));
  assert.throws(() => saveSequenceDraft(null, broken, false));

  assert.deepEqual(loadSequenceDraft(id), before);
  assert.equal(getAllSequences().length, count);
});

test('importing a section into another sequence copies it and leaves the original as it was', () => {
  const legs = tag('Glutes');
  const source = newSequenceDraft();
  source.sections[0].exercises.push(
    exercise('Bridge', { tagValueIds: [legs.tagValueId], tags: [legs], loadBase: ['icon-a'] }),
    exercise('Clam', { side: 'left' })
  );
  const sourceId = saveSequenceDraft(null, { ...source, name: 'Source' }, false);
  const before = loadSequenceDraft(sourceId);

  const target = newSequenceDraft();
  target.sections.push(copySectionToDraft(before!.sections[0]));
  const targetId = saveSequenceDraft(null, { ...target, name: 'Target' }, false);

  assert.deepEqual(loadSequenceDraft(sourceId), before);
  const copied = loadSequenceDraft(targetId)!.sections[1];
  assert.deepEqual(
    plain(copied.exercises.map(({ id: _, ...rest }) => rest)),
    plain(before!.sections[0].exercises.map(({ id: _, ...rest }) => rest))
  );
  assert.notEqual(copied.id, before!.sections[0].id);
  assert.notEqual(copied.exercises[0].id, before!.sections[0].exercises[0].id);
});

test('loading a missing sequence gives null', () => {
  assert.equal(loadSequenceDraft('not-a-sequence'), null);
});

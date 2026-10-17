import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from '../db/client.ts';
import { runMigrations } from '../db/schema.ts';
import { createSequence, getAllSequences } from '../db/sequences.ts';
import { createSection, getSectionsBySequenceId } from '../db/sections.ts';
import { createExercise, getExercisesBySequenceId } from '../db/exercises.ts';
import { createTagCategory, createTagValue, getOwnTagsForExercise, setExerciseTags } from '../db/tags.ts';
import {
  createLibraryExercise,
  setLibraryExerciseTags,
  updateLibraryExerciseBilateral,
  updateLibraryExerciseLoad,
} from '../db/libraryExercises.ts';
import { createLoadIcon, deleteLoadIcon, getAllLoadIcons, parseLoad } from '../db/loadIcons.ts';
import { buildShareUrl, decodeShareData, importSharedSequence, serializeSequence } from './shareSequence.ts';
import type { SharePayload } from './sharePayload.ts';

const db = getDb();
const sequenceCount = () => getAllSequences().length;
/** A load's icons as "color/size/label", to compare icons across phones by how they look. */
const iconsOf = (load: string | null) =>
  (parseLoad(load) ?? []).map((id) => {
    const icon = getAllLoadIcons().find((i) => i.id === id)!;
    return `${icon.color}/${icon.size}/${icon.label}`;
  });

// The sender's sequence: an exercise with its own loads, variations and tags, and one that takes
// its load, tags and left/right flag from the library.
let payload: SharePayload;
let ball: { id: string };
let band: { id: string };

before(() => {
  runMigrations();
  ball = createLoadIcon('#3B82F6', 'S', 'Ball');
  band = createLoadIcon('#EF4444', null, 'Band');
  const lib = createLibraryExercise('Lunge');
  updateLibraryExerciseLoad(lib.id, null, JSON.stringify([band.id]), null);
  updateLibraryExerciseBilateral(lib.id, true);
  setLibraryExerciseTags(lib.id, [createTagValue(createTagCategory('Area').id, 'Legs').id]);

  const seq = createSequence('Barre');
  const warmup = createSection(seq.id, 'Warmup');
  const main = createSection(seq.id, 'Main');
  const squat = createExercise(
    seq.id,
    warmup.id,
    'Squat',
    30,
    'knees',
    null,
    'pulse',
    null,
    [{ instruction: 'hold', atSeconds: 20 }],
    { modified: null, base: JSON.stringify([ball.id, band.id]), amplified: JSON.stringify([ball.id]) }
  );
  setExerciseTags(squat.id, [createTagValue(createTagCategory('Level').id, 'Hard').id]);
  createExercise(seq.id, main.id, 'Lunge', 40, undefined, lib.id, null, 'left');
  payload = serializeSequence(seq.id);
});

test('sends loads by value, each icon once, including loads from the library', () => {
  assert.equal(payload.v, 2);
  assert.deepEqual(payload.icons, [
    { color: '#3B82F6', label: 'Ball', size: 'S' },
    { color: '#EF4444', label: 'Band' },
  ]);
  const [squat] = payload.sections[0].exercises;
  const [lunge] = payload.sections[1].exercises;
  assert.deepEqual(squat.loads, { base: [0, 1], amplified: [0] });
  assert.deepEqual(squat.variation_sets, [{ instruction: 'hold', atSeconds: 20 }]);
  assert.deepEqual(squat.tags, [{ c: 'Level', l: 'Hard' }]);
  assert.deepEqual(lunge.loads, { base: [1] });
  assert.equal(lunge.is_bilateral, 1);
  assert.deepEqual(lunge.tags, [{ c: 'Area', l: 'Legs' }]);
});

test('on another phone: reuses lookalike icons and tags, and creates what is missing', () => {
  // Turn this database into the receiver's: the sender's icons are gone, a Ball that looks the
  // same (but differs in case) exists, and the Legs tag differs in case.
  db.runSync('UPDATE exercises SET load_base = NULL, load_amplified = NULL;');
  db.runSync('UPDATE library_exercises SET load_base = NULL;');
  deleteLoadIcon(ball.id);
  deleteLoadIcon(band.id);
  const lookalike = createLoadIcon('#3b82f6', 'S', 'ball');
  const legs = db.getFirstSync<{ id: string }>(`SELECT id FROM tag_values WHERE label = 'Legs';`)!;
  db.runSync(`UPDATE tag_values SET label = 'legs' WHERE id = ?;`, [legs.id]);

  const newId = importSharedSequence(decodeShareData(buildShareUrl(payload))!);
  assert.deepEqual(
    getSectionsBySequenceId(newId).map((s) => s.name),
    ['Warmup', 'Main']
  );
  const [squat, lunge] = getExercisesBySequenceId(newId);
  assert.equal(parseLoad(squat.load_base)![0], lookalike.id);
  assert.deepEqual(iconsOf(squat.load_base), ['#3b82f6/S/ball', '#EF4444/null/Band']);
  assert.deepEqual(iconsOf(squat.load_amplified), ['#3b82f6/S/ball']);
  assert.equal(getAllLoadIcons().length, 2, 'only Band was created');
  assert.equal(squat.variation_sets, '[{"instruction":"hold","atSeconds":20}]');
  assert.equal(squat.notes, 'knees');
  assert.equal(lunge.is_bilateral, 1);
  assert.equal(lunge.side, 'left');
  assert.equal(lunge.library_exercise_id, null);
  assert.deepEqual(
    getOwnTagsForExercise(lunge.id).map((t) => t.tagValueId),
    [legs.id]
  );
});

test('a version 1 link keeps only the load icons that exist on this phone', () => {
  const local = getAllLoadIcons()[0];
  const v1 = {
    v: 1,
    name: 'Old',
    sections: [
      {
        name: 'Main',
        exercises: [{ name: 'Row', duration: 20, load_base: JSON.stringify([local.id, 'from-another-phone']) }],
      },
    ],
  };
  const newId = importSharedSequence(decodeShareData(JSON.stringify(v1))!);
  assert.deepEqual(parseLoad(getExercisesBySequenceId(newId)[0].load_base), [local.id]);
});

test('icons that no exercise uses are not created', () => {
  const count = getAllLoadIcons().length;
  const link = {
    v: 2,
    name: 'Junk',
    icons: Array.from({ length: 50 }, (_, i) => ({ color: '#123456', label: `Junk ${i}` })),
    sections: [{ name: 'Main', exercises: [{ name: 'Row', duration: 20, loads: { base: [7] } }] }],
  };
  const newId = importSharedSequence(decodeShareData(JSON.stringify(link))!);
  assert.equal(getAllLoadIcons().length, count + 1);
  assert.deepEqual(iconsOf(getExercisesBySequenceId(newId)[0].load_base), ['#123456/null/Junk 7']);
});

test('an import that fails partway leaves nothing behind', () => {
  const count = sequenceCount();
  const broken = {
    ...payload,
    sections: [...payload.sections, { name: 'Boom', exercises: [{ name: null as unknown as string, duration: 1 }] }],
  };
  assert.throws(() => importSharedSequence(broken));
  assert.equal(sequenceCount(), count);
});

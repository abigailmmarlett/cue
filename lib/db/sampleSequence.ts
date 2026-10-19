import { transaction } from './client';
import { getAllSequences } from './sequences';
import { createLibraryExercise } from './libraryExercises';
import { getPreference, setPreference } from './preferences';
import { createTagCategory, createTagValue, type ExerciseTag } from './tags';
import { saveSequenceDraft, type DraftExercise, type DraftSection } from './sequenceDraft';
import { generateId } from '../utils/id';

const ADDED_KEY = 'sampleSequenceAdded';

export const SAMPLE_SEQUENCE_NAME = 'Sample: 5-Minute Pilates';

interface SampleExercise {
  name: string;
  duration: number;
  side?: 'left' | 'right';
  variations?: string[];
}

const SECTIONS: { name: string; exercises: SampleExercise[] }[] = [
  {
    name: 'Warm-up',
    exercises: [
      { name: 'Pelvic tilts', duration: 30 },
      { name: 'Cat-cow', duration: 30 },
    ],
  },
  {
    name: 'Core',
    exercises: [
      { name: 'The Hundred', duration: 45, variations: ['Legs in tabletop', 'Extend legs to 45°'] },
      { name: 'Single-leg stretch', duration: 30 },
      { name: 'Side-lying leg lift', duration: 30, side: 'left' },
      { name: 'Side-lying leg lift', duration: 30, side: 'right' },
      { name: 'Plank', duration: 45, variations: ['Hold', 'Lift alternate legs'] },
    ],
  },
  {
    name: 'Cool-down',
    exercises: [
      { name: 'Spine stretch forward', duration: 30 },
      { name: "Child's pose", duration: 30 },
    ],
  },
];

const TAGS = [
  { category: 'Style', label: 'Pilates' },
  { category: 'Level', label: 'Beginner' },
];

/**
 * On a brand-new install, adds a short sample sequence, with its exercises in the library, so there's
 * something to explore (and for the tour to point at). It's added at most once: existing users never
 * get it, and deleting it doesn't bring it back.
 */
export function addSampleSequenceIfNew(): void {
  transaction(() => {
    if (getPreference(ADDED_KEY)) return;
    setPreference(ADDED_KEY, 'true');
    if (getAllSequences().length > 0) return;

    // One library entry per exercise, so the left and right sides share theirs.
    const libraryIds = new Map<string, string>();
    for (const ex of SECTIONS.flatMap((s) => s.exercises)) {
      if (!libraryIds.has(ex.name)) libraryIds.set(ex.name, createLibraryExercise(ex.name, !!ex.side).id);
    }

    const sections: DraftSection[] = SECTIONS.map((section) => ({
      id: generateId(),
      name: section.name,
      exercises: section.exercises.map((ex): DraftExercise => ({
        id: generateId(),
        name: ex.name,
        duration: ex.duration,
        notes: null,
        tagValueIds: [],
        tags: [],
        libraryExerciseId: libraryIds.get(ex.name),
        loadModified: null,
        loadBase: null,
        loadAmplified: null,
        variation: null,
        variationSets: ex.variations?.map((instruction) => ({ instruction, atSeconds: null })) ?? null,
        isBilateral: !!ex.side,
        side: ex.side ?? null,
      })),
    }));

    const tags: ExerciseTag[] = TAGS.map(({ category, label }) => ({
      tagValueId: createTagValue(createTagCategory(category).id, label).id,
      categoryName: category,
      label,
    }));

    saveSequenceDraft(null, { name: SAMPLE_SEQUENCE_NAME, tags, sections }, false);
  });
}

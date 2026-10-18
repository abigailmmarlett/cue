import { transaction } from './client';
import { createSequence, getSequenceById, updateSequence } from './sequences';
import { deleteSection, getSectionsBySequenceId, upsertSection } from './sections';
import {
  deleteExercise,
  getExercisesBySectionId,
  getExercisesBySequenceId,
  parseVariationSets,
  upsertExercise,
  type Exercise,
  type VariationItem,
} from './exercises';
import { getOwnTagsForExercise, getTagsForSequence, setExerciseTags, setSequenceTags, type ExerciseTag } from './tags';
import { addUnlinkedToLibrary, getLibraryExercise } from './libraryExercises';
import { loadOverride, parseLoad } from './loadIcons';
import { generateId } from '../utils/id';

/** An exercise as the builder edits it, before it's saved. */
export interface DraftExercise {
  id: string;
  name: string;
  duration: number;
  notes?: string | null;
  /** The exercise's own tags; a linked exercise without any shows its library entry's. */
  tagValueIds: string[];
  tags: ExerciseTag[];
  libraryExerciseId?: string | null;
  loadModified: string[] | null;
  loadBase: string[] | null;
  loadAmplified: string[] | null;
  variation: string | null;
  variationSets: VariationItem[] | null;
  isBilateral: boolean;
  side: 'left' | 'right' | null;
}

export interface DraftSection {
  id: string;
  name: string;
  exercises: DraftExercise[];
}

/** A sequence as the builder edits it. */
export interface SequenceDraft {
  name: string;
  tags: ExerciseTag[];
  sections: DraftSection[];
}

/** What the builder starts from for a new sequence. */
export function newSequenceDraft(): SequenceDraft {
  return { name: '', tags: [], sections: [{ id: generateId(), name: 'Main', exercises: [] }] };
}

/** A saved exercise as the builder edits it. Loads are its effective ones (its own, else the library's). */
export function toDraftExercise(e: Exercise): DraftExercise {
  const ownTags = getOwnTagsForExercise(e.id);
  return {
    id: e.id,
    name: e.name,
    duration: e.duration,
    notes: e.notes,
    tagValueIds: ownTags.map((t) => t.tagValueId),
    tags: ownTags,
    libraryExerciseId: e.library_exercise_id,
    loadModified: parseLoad(e.load_modified),
    loadBase: parseLoad(e.load_base),
    loadAmplified: parseLoad(e.load_amplified),
    variation: e.variation,
    variationSets: parseVariationSets(e.variation_sets),
    isBilateral: !!e.is_bilateral,
    side: e.side,
  };
}

/**
 * A copy of a saved section, to add to another sequence's draft. Everything gets a new id, so saving
 * the draft adds new rows; reusing the ids would move the original section's exercises instead.
 * Only each exercise's own tags come along; linked exercises keep inheriting their library tags.
 */
export function copySectionToDraft(section: { id: string; name: string }): DraftSection {
  return {
    id: generateId(),
    name: section.name,
    exercises: getExercisesBySectionId(section.id).map((ex) => ({ ...toDraftExercise(ex), id: generateId() })),
  };
}

/** The saved sequence as the builder edits it, or null if it doesn't exist. */
export function loadSequenceDraft(id: string): SequenceDraft | null {
  const seq = getSequenceById(id);
  if (!seq) return null;
  const exercises = getExercisesBySequenceId(id);
  return {
    name: seq.name,
    tags: getTagsForSequence(id),
    sections: getSectionsBySequenceId(id).map((s) => ({
      id: s.id,
      name: s.name,
      exercises: exercises.filter((e) => e.section_id === s.id).map(toDraftExercise),
    })),
  };
}

/**
 * Saves the draft as sequence `id`, or as a new sequence when `id` is null, and returns its id. The
 * saved sections and exercises then match the draft's, in its order. With `addToLibrary`, named
 * exercises that aren't in the library are added to it first. All or nothing: if any write fails,
 * nothing is saved.
 */
export function saveSequenceDraft(id: string | null, draft: SequenceDraft, addToLibrary: boolean): string {
  return transaction(() => {
    const name = draft.name.trim() || 'Untitled Sequence';
    const sequenceId = id ?? createSequence(name).id;
    if (id) updateSequence(id, name);
    setSequenceTags(
      sequenceId,
      draft.tags.map((t) => t.tagValueId)
    );

    const sections = addToLibrary ? addUnlinkedToLibrary(draft.sections) : draft.sections;
    const keepSections = new Set(sections.map((s) => s.id));
    const keepExercises = new Set(sections.flatMap((s) => s.exercises.map((e) => e.id)));
    for (const e of getExercisesBySequenceId(sequenceId)) {
      if (!keepExercises.has(e.id)) deleteExercise(e.id);
    }
    for (const s of getSectionsBySequenceId(sequenceId)) {
      if (!keepSections.has(s.id)) deleteSection(s.id);
    }

    sections.forEach((section, sIdx) => {
      upsertSection(section.id, sequenceId, section.name.trim() || 'Section', sIdx);
      section.exercises.forEach((ex, eIdx) => {
        const libId = ex.libraryExerciseId ?? null;
        const libEx = libId ? getLibraryExercise(libId) : null;
        upsertExercise(
          ex.id,
          sequenceId,
          section.id,
          ex.name.trim() || 'Exercise',
          ex.duration,
          eIdx,
          ex.notes ?? null,
          libId,
          // A linked exercise stores a load only where it differs from the library's.
          loadOverride(ex.loadModified, libEx?.load_modified),
          loadOverride(ex.loadBase, libEx?.load_base),
          loadOverride(ex.loadAmplified, libEx?.load_amplified),
          ex.variation ?? null,
          ex.side ?? null,
          ex.variationSets?.length ? ex.variationSets : null,
          ex.isBilateral
        );
        setExerciseTags(ex.id, ex.tagValueIds);
      });
    });
    return sequenceId;
  });
}

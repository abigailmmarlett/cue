import { getSequenceById, createSequence } from '../db/sequences';
import { getSectionsBySequenceId, createSection } from '../db/sections';
import { createExercise, getExercisesBySequenceId, parseVariationSets } from '../db/exercises';
import { createTagCategory, createTagValue, getTagsForSequenceExercises, setExerciseTags } from '../db/tags';
import { findOrCreateLoadIcon, getAllLoadIcons, parseLoad, serializeLoad } from '../db/loadIcons';
import { transaction } from '../db/client';
import type { LoadKind, ShareExercise, ShareLoadIcon, SharePayload } from './sharePayload';

export {
  buildShareUrl,
  decodeShareData,
  importRouteData,
  validateSharePayload,
  type SharePayload,
} from './sharePayload';

/** Builds a version 2 share payload for a sequence, with each exercise's effective loads and tags. */
export function serializeSequence(id: string): SharePayload {
  const sequence = getSequenceById(id);
  if (!sequence) throw new Error(`Sequence ${id} not found`);

  const iconsById = new Map(getAllLoadIcons().map((icon) => [icon.id, icon]));
  const icons: ShareLoadIcon[] = [];
  const iconIndex = new Map<string, number>();
  // Loads are sent by value: each icon once in `icons`, referenced by position.
  const loadRefs = (json: string | null): number[] | undefined => {
    const refs = (parseLoad(json) ?? []).flatMap((iconId) => {
      const icon = iconsById.get(iconId);
      if (!icon) return [];
      if (!iconIndex.has(iconId)) {
        iconIndex.set(iconId, icons.length);
        icons.push({ color: icon.color, label: icon.label, ...(icon.size ? { size: icon.size } : {}) });
      }
      return [iconIndex.get(iconId)!];
    });
    return refs.length > 0 ? refs : undefined;
  };

  const tags = getTagsForSequenceExercises(id);
  const exercises = getExercisesBySequenceId(id);
  const sections = getSectionsBySequenceId(id).map((section) => ({
    name: section.name,
    exercises: exercises
      .filter((ex) => ex.section_id === section.id)
      .map((ex) => {
        const out: ShareExercise = { name: ex.name, duration: ex.duration };
        if (ex.notes) out.notes = ex.notes;
        if (ex.variation) out.variation = ex.variation;
        const variationSets = parseVariationSets(ex.variation_sets);
        if (variationSets) out.variation_sets = variationSets;
        if (ex.side) out.side = ex.side;
        if (ex.is_bilateral) out.is_bilateral = 1;
        const loads: ShareExercise['loads'] = {};
        const modified = loadRefs(ex.load_modified);
        if (modified) loads.modified = modified;
        const base = loadRefs(ex.load_base);
        if (base) loads.base = base;
        const amplified = loadRefs(ex.load_amplified);
        if (amplified) loads.amplified = amplified;
        if (Object.keys(loads).length > 0) out.loads = loads;
        const exTags = tags.get(ex.id);
        if (exTags?.length) out.tags = exTags.map((t) => ({ c: t.categoryName, l: t.label }));
        return out;
      }),
  }));

  return icons.length > 0 ? { v: 2, name: sequence.name, icons, sections } : { v: 2, name: sequence.name, sections };
}

/** Saves a validated share payload as a new sequence, all or nothing. Returns the new sequence's id. */
export function importSharedSequence(payload: SharePayload): string {
  return transaction(() => insertSharedSequence(payload));
}

function insertSharedSequence(payload: SharePayload): string {
  // Match the sender's icons to ones that look the same here, adding any that are missing.
  const iconIds = (payload.icons ?? []).map(
    (icon) => findOrCreateLoadIcon(icon.color, icon.size ?? null, icon.label).id
  );
  const localIconIds = new Set(getAllLoadIcons().map((icon) => icon.id));
  const load = (ex: ShareExercise, kind: LoadKind): string | null => {
    const refs = ex.loads?.[kind];
    if (refs) return serializeLoad(refs.map((i) => iconIds[i]));
    // Version 1 links sent icon ids, which only exist on the sender's phone.
    return serializeLoad(ex.legacy_loads?.[kind]?.filter((iconId) => localIconIds.has(iconId)) ?? null);
  };

  const sequence = createSequence(payload.name);
  for (const sec of payload.sections) {
    const section = createSection(sequence.id, sec.name);
    for (const ex of sec.exercises) {
      const created = createExercise(
        sequence.id,
        section.id,
        ex.name,
        ex.duration,
        ex.notes,
        null,
        ex.variation ?? null,
        ex.side ?? null,
        ex.variation_sets ?? null,
        { modified: load(ex, 'modified'), base: load(ex, 'base'), amplified: load(ex, 'amplified') },
        ex.is_bilateral === 1
      );
      if (ex.tags?.length) {
        const tagValueIds = ex.tags.map((t) => createTagValue(createTagCategory(t.c).id, t.l).id);
        setExerciseTags(created.id, [...new Set(tagValueIds)]);
      }
    }
  }
  return sequence.id;
}

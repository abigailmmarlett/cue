import db from './client';
import { generateId } from '../utils/id';

export interface VariationItem {
  instruction: string;
  atSeconds: number | null;
}

export function computeVariationFractions(items: VariationItem[], duration: number): number[] {
  return items.map((v, i) =>
    v.atSeconds != null
      ? v.atSeconds / duration
      : (i + 1) / (items.length + 1)
  );
}

export interface Exercise {
  id: string;
  sequence_id: string;
  section_id: string;
  name: string;
  duration: number;
  order_index: number;
  notes: string | null;
  created_at: number;
  library_exercise_id: string | null;
  load_modified: string | null;
  load_base: string | null;
  load_amplified: string | null;
  variation: string | null;
  variation_sets: string | null; // JSON-encoded VariationItem[]
  side: 'left' | 'right' | null;
  is_bilateral: number; // 0 | 1 from library join
}

export function getExercisesBySequenceId(sequenceId: string): Exercise[] {
  return db.getAllSync<Exercise>(
    `SELECT e.id, e.sequence_id, e.section_id, e.name, e.duration, e.order_index, e.notes, e.created_at, e.library_exercise_id,
      COALESCE(e.load_modified, le.load_modified) AS load_modified,
      COALESCE(e.load_base, le.load_base) AS load_base,
      COALESCE(e.load_amplified, le.load_amplified) AS load_amplified,
      e.variation, e.variation_sets, e.side,
      COALESCE(le.is_bilateral, 0) AS is_bilateral
     FROM exercises e
     LEFT JOIN library_exercises le ON le.id = e.library_exercise_id
     LEFT JOIN sections s ON s.id = e.section_id
     WHERE e.sequence_id = ?
     ORDER BY COALESCE(s.order_index, 0), e.order_index;`,
    [sequenceId]
  );
}

export function deleteExercisesBySequenceId(sequenceId: string): void {
  db.runSync(`DELETE FROM exercises WHERE sequence_id = ?;`, [sequenceId]);
}

export function getExercisesBySectionId(sectionId: string): Exercise[] {
  return db.getAllSync<Exercise>(
    `SELECT e.id, e.sequence_id, e.section_id, e.name, e.duration, e.order_index, e.notes, e.created_at, e.library_exercise_id,
      COALESCE(e.load_modified, le.load_modified) AS load_modified,
      COALESCE(e.load_base, le.load_base) AS load_base,
      COALESCE(e.load_amplified, le.load_amplified) AS load_amplified,
      e.variation, e.variation_sets, e.side,
      COALESCE(le.is_bilateral, 0) AS is_bilateral
     FROM exercises e
     LEFT JOIN library_exercises le ON le.id = e.library_exercise_id
     WHERE e.section_id = ?
     ORDER BY e.order_index;`,
    [sectionId]
  );
}

export function createExercise(
  sequenceId: string,
  sectionId: string,
  name: string,
  duration: number,
  notes?: string,
  libraryExerciseId?: string | null,
  variation?: string | null,
  side?: 'left' | 'right' | null,
  variationSets?: VariationItem[] | null
): Exercise {
  const id = generateId();
  const now = Date.now();
  const maxIndex = db.getFirstSync<{ max_index: number | null }>(
    `SELECT MAX(order_index) as max_index FROM exercises WHERE section_id = ?;`,
    [sectionId]
  );
  const orderIndex = (maxIndex?.max_index ?? -1) + 1;
  const variationSetsJson = variationSets?.length ? JSON.stringify(variationSets) : null;

  db.runSync(
    `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at, library_exercise_id, variation, variation_sets, side)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, sequenceId, sectionId, name, duration, orderIndex, notes ?? null, now, libraryExerciseId ?? null, variation ?? null, variationSetsJson, side ?? null]
  );

  return { id, sequence_id: sequenceId, section_id: sectionId, name, duration, order_index: orderIndex, notes: notes ?? null, created_at: now, library_exercise_id: libraryExerciseId ?? null, load_modified: null, load_base: null, load_amplified: null, variation: variation ?? null, variation_sets: variationSetsJson, side: side ?? null, is_bilateral: 0 };
}

export function upsertExercise(
  id: string,
  sequenceId: string,
  sectionId: string,
  name: string,
  duration: number,
  orderIndex: number,
  notes: string | null,
  libraryExerciseId: string | null = null,
  loadModified: string | null = null,
  loadBase: string | null = null,
  loadAmplified: string | null = null,
  variation: string | null = null,
  side: 'left' | 'right' | null = null,
  variationSets: VariationItem[] | null = null
): void {
  const variationSetsJson = variationSets?.length ? JSON.stringify(variationSets) : null;
  db.runSync(
    `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at, library_exercise_id, load_modified, load_base, load_amplified, variation, variation_sets, side)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       duration = excluded.duration,
       section_id = excluded.section_id,
       order_index = excluded.order_index,
       notes = excluded.notes,
       library_exercise_id = excluded.library_exercise_id,
       load_modified = excluded.load_modified,
       load_base = excluded.load_base,
       load_amplified = excluded.load_amplified,
       variation = excluded.variation,
       variation_sets = excluded.variation_sets,
       side = excluded.side;`,
    [id, sequenceId, sectionId, name, duration, orderIndex, notes, Date.now(), libraryExerciseId, loadModified, loadBase, loadAmplified, variation, variationSetsJson, side]
  );
}

export function updateExercise(
  id: string,
  fields: Partial<Pick<Exercise, 'name' | 'duration' | 'notes'>>
): void {
  const parts: string[] = [];
  const values: (string | number | null)[] = [];

  if (fields.name !== undefined) { parts.push('name = ?'); values.push(fields.name); }
  if (fields.duration !== undefined) { parts.push('duration = ?'); values.push(fields.duration); }
  if (fields.notes !== undefined) { parts.push('notes = ?'); values.push(fields.notes); }

  if (parts.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE exercises SET ${parts.join(', ')} WHERE id = ?;`, values);
}

export function deleteExercise(id: string): void {
  db.runSync(`DELETE FROM exercises WHERE id = ?;`, [id]);
}

export function reorderExercises(sectionId: string, orderedIds: string[]): void {
  for (let i = 0; i < orderedIds.length; i++) {
    db.runSync(
      `UPDATE exercises SET order_index = ? WHERE id = ? AND section_id = ?;`,
      [i, orderedIds[i], sectionId]
    );
  }
}

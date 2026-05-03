import db from './client';
import { generateId } from '../utils/id';

export interface Exercise {
  id: string;
  sequence_id: string;
  section_id: string;
  name: string;
  duration: number;
  order_index: number;
  notes: string | null;
  created_at: number;
}

export function getExercisesBySequenceId(sequenceId: string): Exercise[] {
  return db.getAllSync<Exercise>(
    `SELECT e.* FROM exercises e
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
    `SELECT * FROM exercises WHERE section_id = ? ORDER BY order_index;`,
    [sectionId]
  );
}

export function createExercise(
  sequenceId: string,
  sectionId: string,
  name: string,
  duration: number,
  notes?: string
): Exercise {
  const id = generateId();
  const now = Date.now();
  const maxIndex = db.getFirstSync<{ max_index: number | null }>(
    `SELECT MAX(order_index) as max_index FROM exercises WHERE section_id = ?;`,
    [sectionId]
  );
  const orderIndex = (maxIndex?.max_index ?? -1) + 1;

  db.runSync(
    `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, sequenceId, sectionId, name, duration, orderIndex, notes ?? null, now]
  );

  return { id, sequence_id: sequenceId, section_id: sectionId, name, duration, order_index: orderIndex, notes: notes ?? null, created_at: now };
}

export function upsertExercise(
  id: string,
  sequenceId: string,
  sectionId: string,
  name: string,
  duration: number,
  orderIndex: number,
  notes: string | null
): void {
  db.runSync(
    `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       duration = excluded.duration,
       section_id = excluded.section_id,
       order_index = excluded.order_index,
       notes = excluded.notes;`,
    [id, sequenceId, sectionId, name, duration, orderIndex, notes, Date.now()]
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

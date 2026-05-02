import db from './client';
import { generateId } from '../utils/id';

export interface Exercise {
  id: string;
  sequence_id: string;
  name: string;
  duration: number;
  order_index: number;
  notes: string | null;
  created_at: number;
}

export function getExercisesBySequenceId(sequenceId: string): Exercise[] {
  return db.getAllSync<Exercise>(
    `SELECT * FROM exercises WHERE sequence_id = ? ORDER BY order_index;`,
    [sequenceId]
  );
}

export function createExercise(
  sequenceId: string,
  name: string,
  duration: number,
  notes?: string
): Exercise {
  const id = generateId();
  const now = Date.now();
  const maxIndex = db.getFirstSync<{ max_index: number | null }>(
    `SELECT MAX(order_index) as max_index FROM exercises WHERE sequence_id = ?;`,
    [sequenceId]
  );
  const orderIndex = (maxIndex?.max_index ?? -1) + 1;

  db.runSync(
    `INSERT INTO exercises (id, sequence_id, name, duration, order_index, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, sequenceId, name, duration, orderIndex, notes ?? null, now]
  );

  return { id, sequence_id: sequenceId, name, duration, order_index: orderIndex, notes: notes ?? null, created_at: now };
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

export function reorderExercises(sequenceId: string, orderedIds: string[]): void {
  for (let i = 0; i < orderedIds.length; i++) {
    db.runSync(
      `UPDATE exercises SET order_index = ? WHERE id = ? AND sequence_id = ?;`,
      [i, orderedIds[i], sequenceId]
    );
  }
}

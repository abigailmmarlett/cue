import { getDb, transaction } from './client';
import { generateId } from '../utils/id';
import type { ExerciseTag } from './tags';

export interface Sequence {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  is_favorited: number; // 0 | 1
}

export interface SequenceWithMeta extends Sequence {
  exercise_count: number;
  total_duration: number;
}

export interface SequenceWithTags extends SequenceWithMeta {
  tags: ExerciseTag[];
}

export function getAllSequences(): SequenceWithMeta[] {
  return getDb().getAllSync<SequenceWithMeta>(`
    SELECT
      s.*,
      COUNT(e.id)       AS exercise_count,
      COALESCE(SUM(e.duration), 0) AS total_duration
    FROM sequences s
    LEFT JOIN exercises e ON e.sequence_id = s.id
    GROUP BY s.id
    ORDER BY s.updated_at DESC;
  `);
}

export function getSequenceById(id: string): Sequence | null {
  return getDb().getFirstSync<Sequence>(`SELECT * FROM sequences WHERE id = ?;`, [id]) ?? null;
}

export function createSequence(name: string): Sequence {
  const id = generateId();
  const now = Date.now();
  getDb().runSync(`INSERT INTO sequences (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`, [
    id,
    name,
    now,
    now,
  ]);
  return { id, name, created_at: now, updated_at: now, is_favorited: 0 };
}

export function updateSequence(id: string, name: string): void {
  getDb().runSync(`UPDATE sequences SET name = ?, updated_at = ? WHERE id = ?;`, [name, Date.now(), id]);
}

export function updateSequenceFavorite(id: string, isFavorited: boolean): void {
  getDb().runSync(`UPDATE sequences SET is_favorited = ? WHERE id = ?;`, [isFavorited ? 1 : 0, id]);
}

export function touchSequence(id: string): void {
  getDb().runSync(`UPDATE sequences SET updated_at = ? WHERE id = ?;`, [Date.now(), id]);
}

export function deleteSequence(id: string): void {
  getDb().runSync(`DELETE FROM sequences WHERE id = ?;`, [id]);
}

export function duplicateSequence(id: string): Sequence {
  const original = getSequenceById(id);
  if (!original) throw new Error(`Sequence ${id} not found`);

  const newId = generateId();
  const now = Date.now();
  const newName = `${original.name} (copy)`;

  transaction(() => {
    getDb().runSync(`INSERT INTO sequences (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`, [
      newId,
      newName,
      now,
      now,
    ]);

    const sections = getDb().getAllSync<{ id: string }>(`SELECT id FROM sections WHERE sequence_id = ?;`, [id]);
    for (const sec of sections) {
      const newSectionId = generateId();
      getDb().runSync(
        `INSERT INTO sections (id, sequence_id, name, order_index, created_at)
         SELECT ?, ?, name, order_index, ? FROM sections WHERE id = ?;`,
        [newSectionId, newId, now, sec.id]
      );

      const exercises = getDb().getAllSync<{ id: string }>(`SELECT id FROM exercises WHERE section_id = ?;`, [sec.id]);
      for (const ex of exercises) {
        const newExerciseId = generateId();
        // Copy every exercise column so the duplicate is identical apart from its ids.
        getDb().runSync(
          `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at,
             library_exercise_id, load_modified, load_base, load_amplified, variation, variation_sets, side, is_bilateral)
           SELECT ?, ?, ?, name, duration, order_index, notes, ?,
             library_exercise_id, load_modified, load_base, load_amplified, variation, variation_sets, side, is_bilateral
           FROM exercises WHERE id = ?;`,
          [newExerciseId, newId, newSectionId, now, ex.id]
        );
        getDb().runSync(
          `INSERT INTO exercise_tags (exercise_id, tag_value_id)
           SELECT ?, tag_value_id FROM exercise_tags WHERE exercise_id = ?;`,
          [newExerciseId, ex.id]
        );
      }
    }

    getDb().runSync(
      `INSERT INTO sequence_tags (sequence_id, tag_value_id)
       SELECT ?, tag_value_id FROM sequence_tags WHERE sequence_id = ?;`,
      [newId, id]
    );
  });

  return { id: newId, name: newName, created_at: now, updated_at: now, is_favorited: 0 };
}

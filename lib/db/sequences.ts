import db from './client';
import { generateId } from '../utils/id';

export interface Sequence {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface SequenceWithMeta extends Sequence {
  exercise_count: number;
  total_duration: number;
}

export function getAllSequences(): SequenceWithMeta[] {
  return db.getAllSync<SequenceWithMeta>(`
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
  return db.getFirstSync<Sequence>(
    `SELECT * FROM sequences WHERE id = ?;`,
    [id]
  ) ?? null;
}

export function createSequence(name: string): Sequence {
  const id = generateId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO sequences (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`,
    [id, name, now, now]
  );
  return { id, name, created_at: now, updated_at: now };
}

export function updateSequence(id: string, name: string): void {
  db.runSync(
    `UPDATE sequences SET name = ?, updated_at = ? WHERE id = ?;`,
    [name, Date.now(), id]
  );
}

export function touchSequence(id: string): void {
  db.runSync(
    `UPDATE sequences SET updated_at = ? WHERE id = ?;`,
    [Date.now(), id]
  );
}

export function deleteSequence(id: string): void {
  db.runSync(`DELETE FROM sequences WHERE id = ?;`, [id]);
}

export function duplicateSequence(id: string): Sequence {
  const original = getSequenceById(id);
  if (!original) throw new Error(`Sequence ${id} not found`);

  const newId = generateId();
  const now = Date.now();
  const newName = `${original.name} (copy)`;

  db.runSync(
    `INSERT INTO sequences (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`,
    [newId, newName, now, now]
  );

  const sections = db.getAllSync<{
    id: string; name: string; order_index: number;
  }>(
    `SELECT id, name, order_index FROM sections WHERE sequence_id = ? ORDER BY order_index;`,
    [id]
  );

  for (const sec of sections) {
    const newSectionId = generateId();
    db.runSync(
      `INSERT INTO sections (id, sequence_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?);`,
      [newSectionId, newId, sec.name, sec.order_index, now]
    );

    const exercises = db.getAllSync<{
      name: string; duration: number; order_index: number; notes: string | null;
    }>(
      `SELECT name, duration, order_index, notes FROM exercises WHERE section_id = ? ORDER BY order_index;`,
      [sec.id]
    );

    for (const ex of exercises) {
      db.runSync(
        `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [generateId(), newId, newSectionId, ex.name, ex.duration, ex.order_index, ex.notes ?? null, now]
      );
    }
  }

  return { id: newId, name: newName, created_at: now, updated_at: now };
}

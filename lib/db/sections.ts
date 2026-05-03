import db from './client';
import { generateId } from '../utils/id';

export interface Section {
  id: string;
  sequence_id: string;
  name: string;
  order_index: number;
  created_at: number;
}

export function getSectionsBySequenceId(sequenceId: string): Section[] {
  return db.getAllSync<Section>(
    `SELECT * FROM sections WHERE sequence_id = ? ORDER BY order_index;`,
    [sequenceId]
  );
}

export function createSection(sequenceId: string, name: string): Section {
  const id = generateId();
  const now = Date.now();
  const maxIndex = db.getFirstSync<{ max_index: number | null }>(
    `SELECT MAX(order_index) as max_index FROM sections WHERE sequence_id = ?;`,
    [sequenceId]
  );
  const orderIndex = (maxIndex?.max_index ?? -1) + 1;

  db.runSync(
    `INSERT INTO sections (id, sequence_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?);`,
    [id, sequenceId, name, orderIndex, now]
  );

  return { id, sequence_id: sequenceId, name, order_index: orderIndex, created_at: now };
}

export function updateSection(id: string, name: string): void {
  db.runSync(`UPDATE sections SET name = ? WHERE id = ?;`, [name, id]);
}

export function deleteSection(id: string): void {
  db.runSync(`DELETE FROM sections WHERE id = ?;`, [id]);
}

export function upsertSection(
  id: string,
  sequenceId: string,
  name: string,
  orderIndex: number
): void {
  db.runSync(
    `INSERT INTO sections (id, sequence_id, name, order_index, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       order_index = excluded.order_index;`,
    [id, sequenceId, name, orderIndex, Date.now()]
  );
}

export function reorderSections(sequenceId: string, orderedIds: string[]): void {
  for (let i = 0; i < orderedIds.length; i++) {
    db.runSync(
      `UPDATE sections SET order_index = ? WHERE id = ? AND sequence_id = ?;`,
      [i, orderedIds[i], sequenceId]
    );
  }
}

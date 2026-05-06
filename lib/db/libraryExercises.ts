import db from './client';
import { generateId } from '../utils/id';
import type { ExerciseTag } from './tags';

export interface LibraryExercise {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  load_modified: string | null;
  load_base: string | null;
  load_amplified: string | null;
}

export interface LibraryExerciseWithTags extends LibraryExercise {
  tags: ExerciseTag[];
}

function attachTags(exercises: LibraryExercise[]): LibraryExerciseWithTags[] {
  if (exercises.length === 0) return [];
  const ids = exercises.map((e) => e.id);
  const rows = db.getAllSync<{ library_exercise_id: string; tagValueId: string; categoryName: string; label: string }>(
    `SELECT let.library_exercise_id, tv.id AS tagValueId, tc.name AS categoryName, tv.label
     FROM library_exercise_tags let
     JOIN tag_values tv ON tv.id = let.tag_value_id
     JOIN tag_categories tc ON tc.id = tv.category_id
     WHERE let.library_exercise_id IN (${ids.map(() => '?').join(',')})
     ORDER BY let.library_exercise_id, tc.name, tv.label;`,
    ids
  );
  const tagMap = new Map<string, ExerciseTag[]>();
  for (const row of rows) {
    if (!tagMap.has(row.library_exercise_id)) tagMap.set(row.library_exercise_id, []);
    tagMap.get(row.library_exercise_id)!.push({ tagValueId: row.tagValueId, categoryName: row.categoryName, label: row.label });
  }
  return exercises.map((e) => ({ ...e, tags: tagMap.get(e.id) ?? [] }));
}

export function getAllLibraryExercises(): LibraryExerciseWithTags[] {
  const rows = db.getAllSync<LibraryExercise>(
    `SELECT * FROM library_exercises ORDER BY name COLLATE NOCASE;`
  );
  return attachTags(rows);
}

export function searchLibraryExercises(query: string): LibraryExerciseWithTags[] {
  const rows = db.getAllSync<LibraryExercise>(
    `SELECT * FROM library_exercises WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE;`,
    [`%${query}%`]
  );
  return attachTags(rows);
}

export function getLibraryExercise(id: string): LibraryExerciseWithTags | null {
  const row = db.getFirstSync<LibraryExercise>(
    `SELECT * FROM library_exercises WHERE id = ?;`,
    [id]
  );
  if (!row) return null;
  return attachTags([row])[0];
}

export function createLibraryExercise(name: string): LibraryExercise {
  const id = generateId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO library_exercises (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`,
    [id, name, now, now]
  );
  return { id, name, created_at: now, updated_at: now, load_modified: null, load_base: null, load_amplified: null };
}

export function updateLibraryExercise(id: string, name: string): void {
  const now = Date.now();
  db.runSync(`UPDATE library_exercises SET name = ?, updated_at = ? WHERE id = ?;`, [name, now, id]);
  // Propagate name change to all linked sequence exercises
  db.runSync(`UPDATE exercises SET name = ? WHERE library_exercise_id = ?;`, [name, id]);
}

export function deleteLibraryExercise(id: string): void {
  // Snapshot library tags into exercise_tags for all linked exercises before deleting
  const libTags = db.getAllSync<{ tag_value_id: string }>(
    `SELECT tag_value_id FROM library_exercise_tags WHERE library_exercise_id = ?;`,
    [id]
  );
  const linked = db.getAllSync<{ id: string }>(
    `SELECT id FROM exercises WHERE library_exercise_id = ?;`,
    [id]
  );
  for (const ex of linked) {
    db.runSync(`DELETE FROM exercise_tags WHERE exercise_id = ?;`, [ex.id]);
    for (const { tag_value_id } of libTags) {
      db.runSync(
        `INSERT INTO exercise_tags (exercise_id, tag_value_id) VALUES (?, ?);`,
        [ex.id, tag_value_id]
      );
    }
    db.runSync(`UPDATE exercises SET library_exercise_id = NULL WHERE id = ?;`, [ex.id]);
  }
  db.runSync(`DELETE FROM library_exercises WHERE id = ?;`, [id]);
}

export function setLibraryExerciseTags(libraryExerciseId: string, tagValueIds: string[]): void {
  db.runSync(`DELETE FROM library_exercise_tags WHERE library_exercise_id = ?;`, [libraryExerciseId]);
  for (const tagValueId of tagValueIds) {
    db.runSync(
      `INSERT INTO library_exercise_tags (library_exercise_id, tag_value_id) VALUES (?, ?);`,
      [libraryExerciseId, tagValueId]
    );
  }
}

export function getLinkedCount(libraryExerciseId: string): number {
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM exercises WHERE library_exercise_id = ?;`,
    [libraryExerciseId]
  );
  return row?.count ?? 0;
}

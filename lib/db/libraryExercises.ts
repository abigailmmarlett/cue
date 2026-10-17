import { getDb, transaction } from './client';
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
  is_bilateral: number; // 0 | 1 (SQLite boolean)
}

export interface LibraryExerciseWithTags extends LibraryExercise {
  tags: ExerciseTag[];
}

function attachTags(exercises: LibraryExercise[]): LibraryExerciseWithTags[] {
  if (exercises.length === 0) return [];
  const ids = exercises.map((e) => e.id);
  const rows = getDb().getAllSync<{
    library_exercise_id: string;
    tagValueId: string;
    categoryName: string;
    label: string;
  }>(
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
    tagMap
      .get(row.library_exercise_id)!
      .push({ tagValueId: row.tagValueId, categoryName: row.categoryName, label: row.label });
  }
  return exercises.map((e) => ({ ...e, tags: tagMap.get(e.id) ?? [] }));
}

export function getAllLibraryExercises(): LibraryExerciseWithTags[] {
  const rows = getDb().getAllSync<LibraryExercise>(
    `SELECT id, name, created_at, updated_at, load_modified, load_base, load_amplified, is_bilateral FROM library_exercises ORDER BY name COLLATE NOCASE;`
  );
  return attachTags(rows);
}

export function searchLibraryExercises(query: string): LibraryExerciseWithTags[] {
  const rows = getDb().getAllSync<LibraryExercise>(
    `SELECT id, name, created_at, updated_at, load_modified, load_base, load_amplified, is_bilateral FROM library_exercises WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE;`,
    [`%${query}%`]
  );
  return attachTags(rows);
}

export function getLibraryExercise(id: string): LibraryExerciseWithTags | null {
  const row = getDb().getFirstSync<LibraryExercise>(
    `SELECT id, name, created_at, updated_at, load_modified, load_base, load_amplified, is_bilateral FROM library_exercises WHERE id = ?;`,
    [id]
  );
  if (!row) return null;
  return attachTags([row])[0];
}

export function createLibraryExercise(name: string): LibraryExercise {
  const id = generateId();
  const now = Date.now();
  getDb().runSync(
    `INSERT INTO library_exercises (id, name, created_at, updated_at, is_bilateral) VALUES (?, ?, ?, ?, 0);`,
    [id, name, now, now]
  );
  return {
    id,
    name,
    created_at: now,
    updated_at: now,
    load_modified: null,
    load_base: null,
    load_amplified: null,
    is_bilateral: 0,
  };
}

export function updateLibraryExerciseBilateral(id: string, isBilateral: boolean): void {
  getDb().runSync(`UPDATE library_exercises SET is_bilateral = ?, updated_at = ? WHERE id = ?;`, [
    isBilateral ? 1 : 0,
    Date.now(),
    id,
  ]);
}

export function updateLibraryExerciseLoad(
  id: string,
  loadModified: string | null,
  loadBase: string | null,
  loadAmplified: string | null
): void {
  getDb().runSync(
    `UPDATE library_exercises SET load_modified = ?, load_base = ?, load_amplified = ?, updated_at = ? WHERE id = ?;`,
    [loadModified, loadBase, loadAmplified, Date.now(), id]
  );
}

export function updateLibraryExercise(id: string, name: string): void {
  const now = Date.now();
  transaction(() => {
    getDb().runSync(`UPDATE library_exercises SET name = ?, updated_at = ? WHERE id = ?;`, [name, now, id]);
    // Propagate name change to all linked sequence exercises
    getDb().runSync(`UPDATE exercises SET name = ? WHERE library_exercise_id = ?;`, [name, id]);
  });
}

export function deleteLibraryExercise(id: string): void {
  transaction(() => {
    // Linked exercises read any load or tags they don't override from the library entry,
    // so copy those onto them before unlinking. Their own loads and tags are kept.
    getDb().runSync(
      `UPDATE exercises SET
         load_modified  = COALESCE(load_modified,  (SELECT load_modified  FROM library_exercises WHERE id = ?)),
         load_base      = COALESCE(load_base,      (SELECT load_base      FROM library_exercises WHERE id = ?)),
         load_amplified = COALESCE(load_amplified, (SELECT load_amplified FROM library_exercises WHERE id = ?))
       WHERE library_exercise_id = ?;`,
      [id, id, id, id]
    );
    getDb().runSync(
      `INSERT INTO exercise_tags (exercise_id, tag_value_id)
       SELECT e.id, lt.tag_value_id
       FROM exercises e JOIN library_exercise_tags lt ON lt.library_exercise_id = e.library_exercise_id
       WHERE e.library_exercise_id = ?
         AND NOT EXISTS (SELECT 1 FROM exercise_tags et WHERE et.exercise_id = e.id);`,
      [id]
    );
    getDb().runSync(`UPDATE exercises SET library_exercise_id = NULL WHERE library_exercise_id = ?;`, [id]);
    getDb().runSync(`DELETE FROM library_exercises WHERE id = ?;`, [id]);
  });
}

export function setLibraryExerciseTags(libraryExerciseId: string, tagValueIds: string[]): void {
  transaction(() => {
    getDb().runSync(`DELETE FROM library_exercise_tags WHERE library_exercise_id = ?;`, [libraryExerciseId]);
    for (const tagValueId of tagValueIds) {
      getDb().runSync(`INSERT INTO library_exercise_tags (library_exercise_id, tag_value_id) VALUES (?, ?);`, [
        libraryExerciseId,
        tagValueId,
      ]);
    }
  });
}

export function getLinkedCount(libraryExerciseId: string): number {
  const row = getDb().getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM exercises WHERE library_exercise_id = ?;`,
    [libraryExerciseId]
  );
  return row?.count ?? 0;
}

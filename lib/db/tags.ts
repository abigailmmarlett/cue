import { getDb, transaction } from './client';
import { generateId } from '../utils/id';

export interface TagCategory {
  id: string;
  name: string;
  created_at: number;
}

export interface TagValue {
  id: string;
  category_id: string;
  label: string;
  created_at: number;
}

export interface ExerciseTag {
  tagValueId: string;
  categoryName: string;
  label: string;
}

export function getAllTagCategories(): TagCategory[] {
  return getDb().getAllSync<TagCategory>(`SELECT * FROM tag_categories ORDER BY name;`);
}

/** Returns the category with this name (ignoring case), creating it if there isn't one. */
export function createTagCategory(name: string): TagCategory {
  const existing = getDb().getFirstSync<TagCategory>(`SELECT * FROM tag_categories WHERE name = ? COLLATE NOCASE;`, [
    name,
  ]);
  if (existing) return existing;
  const id = generateId();
  const now = Date.now();
  getDb().runSync(`INSERT INTO tag_categories (id, name, created_at) VALUES (?, ?, ?);`, [id, name, now]);
  return { id, name, created_at: now };
}

/** Renames a category. Returns false, changing nothing, if another category already has that name. */
export function updateTagCategory(id: string, name: string): boolean {
  const clash = getDb().getFirstSync(`SELECT 1 FROM tag_categories WHERE name = ? COLLATE NOCASE AND id != ?;`, [
    name,
    id,
  ]);
  if (clash) return false;
  getDb().runSync(`UPDATE tag_categories SET name = ? WHERE id = ?;`, [name, id]);
  return true;
}

export function deleteTagCategory(id: string): void {
  getDb().runSync(`DELETE FROM tag_categories WHERE id = ?;`, [id]);
}

export function getTagValuesByCategory(categoryId: string): TagValue[] {
  return getDb().getAllSync<TagValue>(`SELECT * FROM tag_values WHERE category_id = ? ORDER BY label;`, [categoryId]);
}

export function getAllTagValuesWithCategory(): (TagValue & { categoryName: string })[] {
  return getDb().getAllSync<TagValue & { categoryName: string }>(
    `SELECT tv.*, tc.name AS categoryName
     FROM tag_values tv
     JOIN tag_categories tc ON tc.id = tv.category_id
     ORDER BY tc.name, tv.label;`
  );
}

/** Returns the value with this label (ignoring case) in the category, creating it if there isn't one. */
export function createTagValue(categoryId: string, label: string): TagValue {
  const existing = getDb().getFirstSync<TagValue>(
    `SELECT * FROM tag_values WHERE category_id = ? AND label = ? COLLATE NOCASE;`,
    [categoryId, label]
  );
  if (existing) return existing;
  const id = generateId();
  const now = Date.now();
  getDb().runSync(`INSERT INTO tag_values (id, category_id, label, created_at) VALUES (?, ?, ?, ?);`, [
    id,
    categoryId,
    label,
    now,
  ]);
  return { id, category_id: categoryId, label, created_at: now };
}

/** Renames a value. Returns false, changing nothing, if its category already has a value with that label. */
export function updateTagValue(id: string, label: string): boolean {
  const clash = getDb().getFirstSync(
    `SELECT 1 FROM tag_values v JOIN tag_values self ON self.id = ?
     WHERE v.category_id = self.category_id AND v.label = ? COLLATE NOCASE AND v.id != self.id;`,
    [id, label]
  );
  if (clash) return false;
  getDb().runSync(`UPDATE tag_values SET label = ? WHERE id = ?;`, [label, id]);
  return true;
}

export function deleteTagValue(id: string): void {
  getDb().runSync(`DELETE FROM tag_values WHERE id = ?;`, [id]);
}

export function getTagsForExercise(exerciseId: string): ExerciseTag[] {
  // Always prefer exercise-level tags if any exist (allows per-sequence overrides).
  // Fall back to library tags only for linked exercises that have never been overridden.
  const ownTags = getDb().getAllSync<ExerciseTag>(
    `SELECT tv.id AS tagValueId, tc.name AS categoryName, tv.label
     FROM exercise_tags et
     JOIN tag_values tv ON tv.id = et.tag_value_id
     JOIN tag_categories tc ON tc.id = tv.category_id
     WHERE et.exercise_id = ?
     ORDER BY tc.name, tv.label;`,
    [exerciseId]
  );
  if (ownTags.length > 0) return ownTags;

  const row = getDb().getFirstSync<{ library_exercise_id: string | null }>(
    `SELECT library_exercise_id FROM exercises WHERE id = ?;`,
    [exerciseId]
  );
  if (row?.library_exercise_id) {
    return getDb().getAllSync<ExerciseTag>(
      `SELECT tv.id AS tagValueId, tc.name AS categoryName, tv.label
       FROM library_exercise_tags let
       JOIN tag_values tv ON tv.id = let.tag_value_id
       JOIN tag_categories tc ON tc.id = tv.category_id
       WHERE let.library_exercise_id = ?
       ORDER BY tc.name, tv.label;`,
      [row.library_exercise_id]
    );
  }
  return [];
}

export function getOwnTagsForExercise(exerciseId: string): ExerciseTag[] {
  return getDb().getAllSync<ExerciseTag>(
    `SELECT tv.id AS tagValueId, tc.name AS categoryName, tv.label
     FROM exercise_tags et
     JOIN tag_values tv ON tv.id = et.tag_value_id
     JOIN tag_categories tc ON tc.id = tv.category_id
     WHERE et.exercise_id = ?
     ORDER BY tc.name, tv.label;`,
    [exerciseId]
  );
}

export function setExerciseTags(exerciseId: string, tagValueIds: string[]): void {
  transaction(() => {
    getDb().runSync(`DELETE FROM exercise_tags WHERE exercise_id = ?;`, [exerciseId]);
    for (const tagValueId of tagValueIds) {
      getDb().runSync(`INSERT INTO exercise_tags (exercise_id, tag_value_id) VALUES (?, ?);`, [exerciseId, tagValueId]);
    }
  });
}

export function getTagsForSequence(sequenceId: string): ExerciseTag[] {
  return getDb().getAllSync<ExerciseTag>(
    `SELECT tv.id AS tagValueId, tc.name AS categoryName, tv.label
     FROM sequence_tags st
     JOIN tag_values tv ON tv.id = st.tag_value_id
     JOIN tag_categories tc ON tc.id = tv.category_id
     WHERE st.sequence_id = ?
     ORDER BY tc.name, tv.label;`,
    [sequenceId]
  );
}

export function setSequenceTags(sequenceId: string, tagValueIds: string[]): void {
  transaction(() => {
    getDb().runSync(`DELETE FROM sequence_tags WHERE sequence_id = ?;`, [sequenceId]);
    for (const tagValueId of tagValueIds) {
      getDb().runSync(`INSERT INTO sequence_tags (sequence_id, tag_value_id) VALUES (?, ?);`, [sequenceId, tagValueId]);
    }
  });
}

export function getAllSequenceTags(): Map<string, ExerciseTag[]> {
  const rows = getDb().getAllSync<{
    sequence_id: string;
    tagValueId: string;
    categoryName: string;
    label: string;
  }>(
    `SELECT st.sequence_id, tv.id AS tagValueId, tc.name AS categoryName, tv.label
     FROM sequence_tags st
     JOIN tag_values tv ON tv.id = st.tag_value_id
     JOIN tag_categories tc ON tc.id = tv.category_id
     ORDER BY st.sequence_id, tc.name, tv.label;`
  );
  const map = new Map<string, ExerciseTag[]>();
  for (const row of rows) {
    if (!map.has(row.sequence_id)) map.set(row.sequence_id, []);
    map.get(row.sequence_id)!.push({ tagValueId: row.tagValueId, categoryName: row.categoryName, label: row.label });
  }
  return map;
}

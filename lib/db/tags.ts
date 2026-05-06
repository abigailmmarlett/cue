import db from './client';
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
  return db.getAllSync<TagCategory>(
    `SELECT * FROM tag_categories ORDER BY name;`
  );
}

export function createTagCategory(name: string): TagCategory {
  const id = generateId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO tag_categories (id, name, created_at) VALUES (?, ?, ?);`,
    [id, name, now]
  );
  return { id, name, created_at: now };
}

export function updateTagCategory(id: string, name: string): void {
  db.runSync(`UPDATE tag_categories SET name = ? WHERE id = ?;`, [name, id]);
}

export function deleteTagCategory(id: string): void {
  db.runSync(`DELETE FROM tag_categories WHERE id = ?;`, [id]);
}

export function getTagValuesByCategory(categoryId: string): TagValue[] {
  return db.getAllSync<TagValue>(
    `SELECT * FROM tag_values WHERE category_id = ? ORDER BY label;`,
    [categoryId]
  );
}

export function getAllTagValuesWithCategory(): Array<TagValue & { categoryName: string }> {
  return db.getAllSync<TagValue & { categoryName: string }>(
    `SELECT tv.*, tc.name AS categoryName
     FROM tag_values tv
     JOIN tag_categories tc ON tc.id = tv.category_id
     ORDER BY tc.name, tv.label;`
  );
}

export function createTagValue(categoryId: string, label: string): TagValue {
  const id = generateId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO tag_values (id, category_id, label, created_at) VALUES (?, ?, ?, ?);`,
    [id, categoryId, label, now]
  );
  return { id, category_id: categoryId, label, created_at: now };
}

export function updateTagValue(id: string, label: string): void {
  db.runSync(`UPDATE tag_values SET label = ? WHERE id = ?;`, [label, id]);
}

export function deleteTagValue(id: string): void {
  db.runSync(`DELETE FROM tag_values WHERE id = ?;`, [id]);
}

export function getTagsForExercise(exerciseId: string): ExerciseTag[] {
  // Always prefer exercise-level tags if any exist (allows per-sequence overrides).
  // Fall back to library tags only for linked exercises that have never been overridden.
  const ownTags = db.getAllSync<ExerciseTag>(
    `SELECT tv.id AS tagValueId, tc.name AS categoryName, tv.label
     FROM exercise_tags et
     JOIN tag_values tv ON tv.id = et.tag_value_id
     JOIN tag_categories tc ON tc.id = tv.category_id
     WHERE et.exercise_id = ?
     ORDER BY tc.name, tv.label;`,
    [exerciseId]
  );
  if (ownTags.length > 0) return ownTags;

  const row = db.getFirstSync<{ library_exercise_id: string | null }>(
    `SELECT library_exercise_id FROM exercises WHERE id = ?;`,
    [exerciseId]
  );
  if (row?.library_exercise_id) {
    return db.getAllSync<ExerciseTag>(
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
  return db.getAllSync<ExerciseTag>(
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
  db.runSync(`DELETE FROM exercise_tags WHERE exercise_id = ?;`, [exerciseId]);
  for (const tagValueId of tagValueIds) {
    db.runSync(
      `INSERT INTO exercise_tags (exercise_id, tag_value_id) VALUES (?, ?);`,
      [exerciseId, tagValueId]
    );
  }
}

export function getTagsForSequence(sequenceId: string): ExerciseTag[] {
  return db.getAllSync<ExerciseTag>(
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
  db.runSync(`DELETE FROM sequence_tags WHERE sequence_id = ?;`, [sequenceId]);
  for (const tagValueId of tagValueIds) {
    db.runSync(
      `INSERT INTO sequence_tags (sequence_id, tag_value_id) VALUES (?, ?);`,
      [sequenceId, tagValueId]
    );
  }
}

export function getAllSequenceTags(): Map<string, ExerciseTag[]> {
  const rows = db.getAllSync<{
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

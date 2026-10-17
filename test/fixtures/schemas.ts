/*
 * Database layouts from earlier versions of Cue, frozen so the migration tests always upgrade the
 * same thing. Never edit these: real phones have databases like them.
 */

/** The first layout: no sections, library, loads, variations, sides or favorites. */
export const ORIGINAL_SCHEMA = `
  CREATE TABLE sequences (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE exercises (
    id TEXT PRIMARY KEY NOT NULL, sequence_id TEXT NOT NULL, name TEXT NOT NULL, duration INTEGER NOT NULL,
    order_index INTEGER NOT NULL, notes TEXT, created_at INTEGER NOT NULL,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
  );
  CREATE TABLE tag_categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE tag_values (
    id TEXT PRIMARY KEY NOT NULL, category_id TEXT NOT NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE CASCADE
  );
  CREATE TABLE exercise_tags (
    exercise_id TEXT NOT NULL, tag_value_id TEXT NOT NULL, PRIMARY KEY (exercise_id, tag_value_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_value_id) REFERENCES tag_values(id) ON DELETE CASCADE
  );
  CREATE TABLE sequence_tags (
    sequence_id TEXT NOT NULL, tag_value_id TEXT NOT NULL, PRIMARY KEY (sequence_id, tag_value_id),
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_value_id) REFERENCES tag_values(id) ON DELETE CASCADE
  );
`;

/**
 * The last layout before numbered migrations (user_version 0), as the old run-every-launch setup
 * code left it. Columns it added later with ALTER TABLE are at the end of their table, as SQLite
 * stores them.
 */
export const UNVERSIONED_SCHEMA = `
  CREATE TABLE sequences (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    is_favorited INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE exercises (
    id TEXT PRIMARY KEY NOT NULL, sequence_id TEXT NOT NULL, name TEXT NOT NULL, duration INTEGER NOT NULL,
    order_index INTEGER NOT NULL, notes TEXT, created_at INTEGER NOT NULL,
    section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
    library_exercise_id TEXT REFERENCES library_exercises(id) ON DELETE SET NULL,
    load_modified TEXT, load_base TEXT, load_amplified TEXT, variation TEXT, variation_sets TEXT, side TEXT,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
  );
  CREATE TABLE sections (
    id TEXT PRIMARY KEY NOT NULL, sequence_id TEXT NOT NULL, name TEXT NOT NULL, order_index INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
  );
  CREATE TABLE tag_categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL);
  CREATE TABLE tag_values (
    id TEXT PRIMARY KEY NOT NULL, category_id TEXT NOT NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE CASCADE
  );
  CREATE TABLE exercise_tags (
    exercise_id TEXT NOT NULL, tag_value_id TEXT NOT NULL, PRIMARY KEY (exercise_id, tag_value_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_value_id) REFERENCES tag_values(id) ON DELETE CASCADE
  );
  CREATE TABLE sequence_tags (
    sequence_id TEXT NOT NULL, tag_value_id TEXT NOT NULL, PRIMARY KEY (sequence_id, tag_value_id),
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_value_id) REFERENCES tag_values(id) ON DELETE CASCADE
  );
  CREATE TABLE library_exercises (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    load_modified TEXT, load_base TEXT, load_amplified TEXT, is_bilateral INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE library_exercise_tags (
    library_exercise_id TEXT NOT NULL, tag_value_id TEXT NOT NULL, PRIMARY KEY (library_exercise_id, tag_value_id),
    FOREIGN KEY (library_exercise_id) REFERENCES library_exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_value_id) REFERENCES tag_values(id) ON DELETE CASCADE
  );
  CREATE TABLE preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  CREATE TABLE load_icons (
    id TEXT PRIMARY KEY NOT NULL, color TEXT NOT NULL, size TEXT, label TEXT NOT NULL, created_at INTEGER NOT NULL
  );
`;

import db from './client';
import { generateId } from '../utils/id';

export function runMigrations(): void {
  db.execSync(`PRAGMA journal_mode = WAL;`);
  db.execSync(`PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sequences (
      id         TEXT    PRIMARY KEY NOT NULL,
      name       TEXT    NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id          TEXT    PRIMARY KEY NOT NULL,
      sequence_id TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      duration    INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      notes       TEXT,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sections (
      id          TEXT    PRIMARY KEY NOT NULL,
      sequence_id TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      order_index INTEGER NOT NULL,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
    );
  `);

  // Add section_id column to exercises if it doesn't exist yet
  try {
    db.execSync(`ALTER TABLE exercises ADD COLUMN section_id TEXT REFERENCES sections(id) ON DELETE SET NULL;`);
  } catch {
    // Column already exists — safe to ignore
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS tag_categories (
      id         TEXT    PRIMARY KEY NOT NULL,
      name       TEXT    NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS tag_values (
      id          TEXT    PRIMARY KEY NOT NULL,
      category_id TEXT    NOT NULL,
      label       TEXT    NOT NULL,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS exercise_tags (
      exercise_id  TEXT NOT NULL,
      tag_value_id TEXT NOT NULL,
      PRIMARY KEY (exercise_id, tag_value_id),
      FOREIGN KEY (exercise_id)  REFERENCES exercises(id)   ON DELETE CASCADE,
      FOREIGN KEY (tag_value_id) REFERENCES tag_values(id)  ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sequence_tags (
      sequence_id  TEXT NOT NULL,
      tag_value_id TEXT NOT NULL,
      PRIMARY KEY (sequence_id, tag_value_id),
      FOREIGN KEY (sequence_id)  REFERENCES sequences(id)   ON DELETE CASCADE,
      FOREIGN KEY (tag_value_id) REFERENCES tag_values(id)  ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS library_exercises (
      id         TEXT    PRIMARY KEY NOT NULL,
      name       TEXT    NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS library_exercise_tags (
      library_exercise_id TEXT NOT NULL,
      tag_value_id        TEXT NOT NULL,
      PRIMARY KEY (library_exercise_id, tag_value_id),
      FOREIGN KEY (library_exercise_id) REFERENCES library_exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_value_id)        REFERENCES tag_values(id)        ON DELETE CASCADE
    );
  `);

  try {
    db.execSync(`ALTER TABLE exercises ADD COLUMN library_exercise_id TEXT REFERENCES library_exercises(id) ON DELETE SET NULL;`);
  } catch {
    // Column already exists
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS preferences (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS load_icons (
      id         TEXT    PRIMARY KEY NOT NULL,
      color      TEXT    NOT NULL,
      size       TEXT,
      label      TEXT    NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  try { db.execSync(`ALTER TABLE library_exercises ADD COLUMN load_modified TEXT;`); } catch {}
  try { db.execSync(`ALTER TABLE library_exercises ADD COLUMN load_base TEXT;`); } catch {}
  try { db.execSync(`ALTER TABLE library_exercises ADD COLUMN load_amplified TEXT;`); } catch {}
  try { db.execSync(`ALTER TABLE exercises ADD COLUMN load_modified TEXT;`); } catch {}
  try { db.execSync(`ALTER TABLE exercises ADD COLUMN load_base TEXT;`); } catch {}
  try { db.execSync(`ALTER TABLE exercises ADD COLUMN load_amplified TEXT;`); } catch {}
  try { db.execSync(`ALTER TABLE exercises ADD COLUMN variation TEXT;`); } catch {}

  // Data migration: assign existing exercises (section_id IS NULL) to a default "Main" section
  const unmigrated = db.getAllSync<{ sequence_id: string }>(
    `SELECT DISTINCT sequence_id FROM exercises WHERE section_id IS NULL;`
  );
  for (const { sequence_id } of unmigrated) {
    const sectionId = generateId();
    const now = Date.now();
    db.runSync(
      `INSERT INTO sections (id, sequence_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?);`,
      [sectionId, sequence_id, 'Main', 0, now]
    );
    db.runSync(
      `UPDATE exercises SET section_id = ? WHERE sequence_id = ? AND section_id IS NULL;`,
      [sectionId, sequence_id]
    );
  }
}

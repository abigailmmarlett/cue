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

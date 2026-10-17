import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb, transaction } from './client';
import { generateId } from '../utils/id';

/**
 * Database changes, applied in order. The database's `user_version` records the last one applied,
 * so each runs exactly once per install.
 *
 * Once a migration has shipped, never edit it: users' data has already been through it. To
 * change the schema, append a new migration with the next version number.
 */
const MIGRATIONS: { version: number; up: (db: SQLiteDatabase) => void }[] = [
  { version: 1, up: baselineSchema },
  { version: 2, up: addLinkIndexes },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export function runMigrations(): void {
  const db = getDb();
  // Neither pragma can change inside a transaction, so set them first.
  db.execSync(`PRAGMA journal_mode = WAL;`);
  db.execSync(`PRAGMA foreign_keys = ON;`);

  const current = db.getFirstSync<{ user_version: number }>(`PRAGMA user_version;`)?.user_version ?? 0;
  if (current > SCHEMA_VERSION) {
    // Opening a newer database with an older app could corrupt it, so refuse instead.
    throw new Error(`Database version ${current} is newer than this app supports (${SCHEMA_VERSION}).`);
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    // Each migration and its version bump commit together, so a failure leaves the database at
    // the last good version and the next launch retries from there.
    transaction(() => {
      migration.up(db);
      db.execSync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}

function hasColumn(db: SQLiteDatabase, table: string, column: string): boolean {
  return db.getAllSync<{ name: string }>(`PRAGMA table_info(${table});`).some((c) => c.name === column);
}

function addColumnIfMissing(db: SQLiteDatabase, table: string, column: string, definition: string): void {
  if (!hasColumn(db, table, column)) db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
}

/**
 * Version 1: the schema as it stood when versioning was introduced. Creates it on a fresh install,
 * and brings databases from before versioning up to it (they may be missing later columns).
 */
function baselineSchema(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sequences (
      id           TEXT    PRIMARY KEY NOT NULL,
      name         TEXT    NOT NULL,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      is_favorited INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sections (
      id          TEXT    PRIMARY KEY NOT NULL,
      sequence_id TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      order_index INTEGER NOT NULL,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS library_exercises (
      id             TEXT    PRIMARY KEY NOT NULL,
      name           TEXT    NOT NULL,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL,
      load_modified  TEXT,
      load_base      TEXT,
      load_amplified TEXT,
      is_bilateral   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id                  TEXT    PRIMARY KEY NOT NULL,
      sequence_id         TEXT    NOT NULL,
      name                TEXT    NOT NULL,
      duration            INTEGER NOT NULL,
      order_index         INTEGER NOT NULL,
      notes               TEXT,
      created_at          INTEGER NOT NULL,
      section_id          TEXT REFERENCES sections(id) ON DELETE SET NULL,
      library_exercise_id TEXT REFERENCES library_exercises(id) ON DELETE SET NULL,
      load_modified       TEXT,
      load_base           TEXT,
      load_amplified      TEXT,
      variation           TEXT,
      variation_sets      TEXT,
      side                TEXT,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tag_categories (
      id         TEXT    PRIMARY KEY NOT NULL,
      name       TEXT    NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tag_values (
      id          TEXT    PRIMARY KEY NOT NULL,
      category_id TEXT    NOT NULL,
      label       TEXT    NOT NULL,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES tag_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exercise_tags (
      exercise_id  TEXT NOT NULL,
      tag_value_id TEXT NOT NULL,
      PRIMARY KEY (exercise_id, tag_value_id),
      FOREIGN KEY (exercise_id)  REFERENCES exercises(id)   ON DELETE CASCADE,
      FOREIGN KEY (tag_value_id) REFERENCES tag_values(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sequence_tags (
      sequence_id  TEXT NOT NULL,
      tag_value_id TEXT NOT NULL,
      PRIMARY KEY (sequence_id, tag_value_id),
      FOREIGN KEY (sequence_id)  REFERENCES sequences(id)   ON DELETE CASCADE,
      FOREIGN KEY (tag_value_id) REFERENCES tag_values(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS library_exercise_tags (
      library_exercise_id TEXT NOT NULL,
      tag_value_id        TEXT NOT NULL,
      PRIMARY KEY (library_exercise_id, tag_value_id),
      FOREIGN KEY (library_exercise_id) REFERENCES library_exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_value_id)        REFERENCES tag_values(id)        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS preferences (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS load_icons (
      id         TEXT    PRIMARY KEY NOT NULL,
      color      TEXT    NOT NULL,
      size       TEXT,
      label      TEXT    NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Columns that older versions of the app added after creating these tables.
  addColumnIfMissing(db, 'sequences', 'is_favorited', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'library_exercises', 'load_modified', 'TEXT');
  addColumnIfMissing(db, 'library_exercises', 'load_base', 'TEXT');
  addColumnIfMissing(db, 'library_exercises', 'load_amplified', 'TEXT');
  addColumnIfMissing(db, 'library_exercises', 'is_bilateral', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'exercises', 'section_id', 'TEXT REFERENCES sections(id) ON DELETE SET NULL');
  addColumnIfMissing(
    db,
    'exercises',
    'library_exercise_id',
    'TEXT REFERENCES library_exercises(id) ON DELETE SET NULL'
  );
  addColumnIfMissing(db, 'exercises', 'load_modified', 'TEXT');
  addColumnIfMissing(db, 'exercises', 'load_base', 'TEXT');
  addColumnIfMissing(db, 'exercises', 'load_amplified', 'TEXT');
  addColumnIfMissing(db, 'exercises', 'variation', 'TEXT');
  addColumnIfMissing(db, 'exercises', 'variation_sets', 'TEXT');
  addColumnIfMissing(db, 'exercises', 'side', 'TEXT');

  // Exercises from before sections existed go into a "Main" section in their sequence.
  const unsectioned = db.getAllSync<{ sequence_id: string }>(
    `SELECT DISTINCT sequence_id FROM exercises WHERE section_id IS NULL;`
  );
  for (const { sequence_id } of unsectioned) {
    const sectionId = generateId();
    db.runSync(`INSERT INTO sections (id, sequence_id, name, order_index, created_at) VALUES (?, ?, ?, ?, ?);`, [
      sectionId,
      sequence_id,
      'Main',
      0,
      Date.now(),
    ]);
    db.runSync(`UPDATE exercises SET section_id = ? WHERE sequence_id = ? AND section_id IS NULL;`, [
      sectionId,
      sequence_id,
    ]);
  }
}

/** Version 2: index the columns used to look up related rows, so those lookups don't scan whole tables. */
function addLinkIndexes(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE INDEX IF NOT EXISTS exercises_sequence_id ON exercises(sequence_id);
    CREATE INDEX IF NOT EXISTS exercises_section_id ON exercises(section_id, order_index);
    CREATE INDEX IF NOT EXISTS exercises_library_exercise_id ON exercises(library_exercise_id);
    CREATE INDEX IF NOT EXISTS sections_sequence_id ON sections(sequence_id, order_index);
    CREATE INDEX IF NOT EXISTS exercise_tags_tag_value_id ON exercise_tags(tag_value_id);
    CREATE INDEX IF NOT EXISTS sequence_tags_tag_value_id ON sequence_tags(tag_value_id);
    CREATE INDEX IF NOT EXISTS library_exercise_tags_tag_value_id ON library_exercise_tags(tag_value_id);
  `);
}

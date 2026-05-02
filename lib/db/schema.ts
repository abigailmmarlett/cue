import db from './client';

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
}

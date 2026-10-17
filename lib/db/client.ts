import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * The app's database. It's opened on first use rather than at import time, so a failure to open
 * it happens inside the root layout's startup check, which can show a retry screen.
 */
export function getDb(): SQLite.SQLiteDatabase {
  db ??= SQLite.openDatabaseSync('cue.db');
  return db;
}

/**
 * Runs `task` atomically: either every write inside it commits, or none do.
 * Nested calls join the outer transaction, so helpers that use this can be
 * composed into a larger save that still commits or rolls back as one unit.
 *
 * A nested call has no savepoint of its own: let its errors propagate. Catching
 * one inside an outer transaction and carrying on would commit its partial writes.
 */
export function transaction<T>(task: () => T): T {
  const database = getDb();
  if (database.isInTransactionSync()) return task();
  let result!: T;
  database.withTransactionSync(() => {
    result = task();
  });
  return result;
}

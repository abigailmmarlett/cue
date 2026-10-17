import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('cue.db');

export default db;

/**
 * Runs `task` atomically: either every write inside it commits, or none do.
 * Nested calls join the outer transaction, so helpers that use this can be
 * composed into a larger save that still commits or rolls back as one unit.
 *
 * A nested call has no savepoint of its own: let its errors propagate. Catching
 * one inside an outer transaction and carrying on would commit its partial writes.
 */
export function transaction<T>(task: () => T): T {
  if (db.isInTransactionSync()) return task();
  let result!: T;
  db.withTransactionSync(() => {
    result = task();
  });
  return result;
}

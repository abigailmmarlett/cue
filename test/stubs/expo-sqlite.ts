import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/** expo-sqlite takes parameters as one array or as separate arguments. */
type Params = SQLInputValue[] | [SQLInputValue[]];
const flatten = (params: Params): SQLInputValue[] =>
  params.length === 1 && Array.isArray(params[0]) ? params[0] : (params as SQLInputValue[]);

/**
 * The parts of expo-sqlite's synchronous API the app uses, backed by Node's built-in SQLite and an
 * in-memory database. Each test file runs in its own process, so each gets a fresh database.
 */
class TestDatabase {
  private db = new DatabaseSync(':memory:');

  execSync(sql: string): void {
    this.db.exec(sql);
  }
  runSync(sql: string, ...params: Params) {
    return this.db.prepare(sql).run(...flatten(params));
  }
  getAllSync<T>(sql: string, ...params: Params): T[] {
    return this.db.prepare(sql).all(...flatten(params)) as T[];
  }
  getFirstSync<T>(sql: string, ...params: Params): T | null {
    return (this.db.prepare(sql).get(...flatten(params)) as T | undefined) ?? null;
  }
  isInTransactionSync(): boolean {
    return this.db.isTransaction;
  }
  // The same steps as expo-sqlite's withTransactionSync.
  withTransactionSync(task: () => void): void {
    try {
      this.execSync('BEGIN');
      task();
      this.execSync('COMMIT');
    } catch (e) {
      this.execSync('ROLLBACK');
      throw e;
    }
  }
}

export type SQLiteDatabase = TestDatabase;

export function openDatabaseSync(_name: string): TestDatabase {
  return new TestDatabase();
}

import { getDb } from './client';

export function getPreference(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setPreference(key: string, value: string): void {
  getDb().runSync(
    'INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

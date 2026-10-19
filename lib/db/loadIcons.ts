import { getDb } from './client';
import { generateId } from '../utils/id';

export interface LoadIcon {
  id: string;
  color: string;
  size: 'S' | 'M' | 'L' | null;
  label: string;
  createdAt: number;
}

export function getAllLoadIcons(): LoadIcon[] {
  return getDb()
    .getAllSync<{ id: string; color: string; size: string | null; label: string; created_at: number }>(
      `SELECT * FROM load_icons ORDER BY created_at ASC;`
    )
    .map((row) => ({
      id: row.id,
      color: row.color,
      size: row.size as 'S' | 'M' | 'L' | null,
      label: row.label,
      createdAt: row.created_at,
    }));
}

export function createLoadIcon(color: string, size: 'S' | 'M' | 'L' | null, label: string): LoadIcon {
  const id = generateId();
  const now = Date.now();
  getDb().runSync(`INSERT INTO load_icons (id, color, size, label, created_at) VALUES (?, ?, ?, ?, ?);`, [
    id,
    color,
    size,
    label,
    now,
  ]);
  return { id, color, size, label, createdAt: now };
}

/** Returns an icon that looks the same (color, size and label), creating one if there isn't one. */
export function findOrCreateLoadIcon(color: string, size: 'S' | 'M' | 'L' | null, label: string): LoadIcon {
  const existing = getDb().getFirstSync<{ id: string; created_at: number }>(
    `SELECT id, created_at FROM load_icons WHERE color = ? COLLATE NOCASE AND size IS ? AND label = ? COLLATE NOCASE;`,
    [color, size, label]
  );
  if (existing) return { id: existing.id, color, size, label, createdAt: existing.created_at };
  return createLoadIcon(color, size, label);
}

export function deleteLoadIcon(id: string): void {
  getDb().runSync(`DELETE FROM load_icons WHERE id = ?;`, [id]);
}

export function parseLoad(json: string | null): string[] | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return null;
  }
}

export function serializeLoad(ids: string[] | null): string | null {
  if (!ids || ids.length === 0) return null;
  return JSON.stringify(ids);
}

/**
 * The builders show a linked exercise's effective loads (its own, else the library's).
 * Store only a load that differs from the library's so later library edits still apply. A load
 * cleared where the library has one is stored as an empty list; null would show the library's again.
 */
export function loadOverride(load: string[] | null, libraryLoad: string | null | undefined): string | null {
  const own = serializeLoad(load);
  const inherited = serializeLoad(parseLoad(libraryLoad ?? null));
  if (own === inherited) return null;
  return own ?? '[]';
}

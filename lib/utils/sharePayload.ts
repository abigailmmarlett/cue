import type { VariationItem } from '../db/exercises';

/*
 * The share-link format, and validation of links received from other people. Kept free of
 * database code so it can be tested on its own.
 *
 * Version 2 sends loads by value (each icon's color, size and label) because icon ids only exist
 * on the sender's phone, and adds variation sets. Version 1 links still import.
 */

export type LoadKind = 'modified' | 'base' | 'amplified';
const LOAD_KINDS: LoadKind[] = ['modified', 'base', 'amplified'];

export interface ShareLoadIcon {
  color: string;
  size?: 'S' | 'M' | 'L';
  label: string;
}

export interface ShareExercise {
  name: string;
  duration: number;
  notes?: string;
  variation?: string;
  variation_sets?: VariationItem[];
  side?: 'left' | 'right';
  is_bilateral?: 1;
  /** Indexes into the payload's `icons`. */
  loads?: Partial<Record<LoadKind, number[]>>;
  /** From version 1 links: the sender's icon ids, which only match icons on the same phone. */
  legacy_loads?: Partial<Record<LoadKind, string[]>>;
  tags?: { c: string; l: string }[];
}

export interface ShareSection {
  name: string;
  exercises: ShareExercise[];
}

export interface SharePayload {
  v: 2;
  name: string;
  icons?: ShareLoadIcon[];
  sections: ShareSection[];
}

export function buildShareUrl(payload: SharePayload): string {
  return `cue://import?data=${encodeURIComponent(JSON.stringify(payload))}`;
}

// Limits for untrusted share payloads; generous for real sequences, small enough to reject junk.
const MAX_NAME_LENGTH = 120;
const MAX_TEXT_LENGTH = 2000;
const MAX_SECTIONS = 50;
const MAX_EXERCISES = 500;
const MAX_TAGS_PER_EXERCISE = 30;
const MAX_ICONS = 50;
const MAX_ICONS_PER_LOAD = 20;
const MAX_VARIATIONS = 20;
const MAX_DURATION_SECONDS = 24 * 60 * 60;
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function cleanString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

/**
 * Keeps the valid icons. `newIndex[i]` is where the sender's icon `i` ended up, or undefined if it
 * was dropped, so loads can be renumbered to match.
 */
function cleanIcons(value: unknown): { icons: ShareLoadIcon[]; newIndex: (number | undefined)[] } {
  const icons: ShareLoadIcon[] = [];
  const newIndex: (number | undefined)[] = [];
  if (!Array.isArray(value)) return { icons, newIndex };
  for (const raw of value.slice(0, MAX_ICONS)) {
    const icon = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const label = cleanString(icon.label, MAX_NAME_LENGTH);
    if (typeof icon.color !== 'string' || !HEX_COLOR.test(icon.color) || !label) {
      newIndex.push(undefined);
      continue;
    }
    const out: ShareLoadIcon = { color: icon.color, label };
    if (icon.size === 'S' || icon.size === 'M' || icon.size === 'L') out.size = icon.size;
    newIndex.push(icons.length);
    icons.push(out);
  }
  return { icons, newIndex };
}

function cleanLoadRefs(value: unknown, newIndex: (number | undefined)[]): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const refs = value
    .map((i) => (Number.isInteger(i) ? newIndex[i as number] : undefined))
    .filter((i): i is number => i !== undefined)
    .slice(0, MAX_ICONS_PER_LOAD);
  return refs.length > 0 ? refs : undefined;
}

/** Version 1 sent each load as a JSON string of icon ids. */
function cleanLegacyLoad(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    const ids = parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_ICONS_PER_LOAD);
    return ids.length > 0 ? ids : undefined;
  } catch {
    return undefined;
  }
}

function cleanVariationSets(value: unknown, duration: number): VariationItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.slice(0, MAX_VARIATIONS).flatMap((raw): VariationItem[] => {
    const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const instruction = cleanString(item.instruction, MAX_TEXT_LENGTH);
    if (!instruction) return [];
    const at = item.atSeconds;
    if (at === null || at === undefined) return [{ instruction, atSeconds: null }];
    if (typeof at !== 'number' || !Number.isFinite(at)) return [];
    return [{ instruction, atSeconds: Math.min(Math.max(Math.round(at), 0), duration) }];
  });
  return items.length > 0 ? items : undefined;
}

function cleanExercise(raw: unknown, version: 1 | 2, iconIndex: (number | undefined)[]): ShareExercise | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const ex = raw as Record<string, unknown>;
  const name = cleanString(ex.name, MAX_NAME_LENGTH);
  const rounded = typeof ex.duration === 'number' ? Math.round(ex.duration) : NaN;
  if (!name || !Number.isFinite(rounded)) return null;

  const duration = Math.min(Math.max(rounded, 1), MAX_DURATION_SECONDS);
  const out: ShareExercise = { name, duration };
  const notes = cleanString(ex.notes, MAX_TEXT_LENGTH);
  if (notes) out.notes = notes;
  const variation = cleanString(ex.variation, MAX_TEXT_LENGTH);
  if (variation) out.variation = variation;
  const variationSets = cleanVariationSets(ex.variation_sets, duration);
  if (variationSets) out.variation_sets = variationSets;
  if (ex.side === 'left' || ex.side === 'right') out.side = ex.side;
  if (ex.is_bilateral === 1 || ex.is_bilateral === true) out.is_bilateral = 1;

  if (version === 2) {
    const rawLoads = (typeof ex.loads === 'object' && ex.loads !== null ? ex.loads : {}) as Record<string, unknown>;
    const loads: ShareExercise['loads'] = {};
    for (const kind of LOAD_KINDS) {
      const refs = cleanLoadRefs(rawLoads[kind], iconIndex);
      if (refs) loads[kind] = refs;
    }
    if (Object.keys(loads).length > 0) out.loads = loads;
  } else {
    const legacy: ShareExercise['legacy_loads'] = {};
    for (const kind of LOAD_KINDS) {
      const ids = cleanLegacyLoad(ex[`load_${kind}`]);
      if (ids) legacy[kind] = ids;
    }
    if (Object.keys(legacy).length > 0) out.legacy_loads = legacy;
  }

  if (Array.isArray(ex.tags)) {
    const tags = ex.tags.slice(0, MAX_TAGS_PER_EXERCISE).flatMap((t) => {
      const c = cleanString((t as { c?: unknown } | null)?.c, MAX_NAME_LENGTH);
      const l = cleanString((t as { l?: unknown } | null)?.l, MAX_NAME_LENGTH);
      return c && l ? [{ c, l }] : [];
    });
    if (tags.length > 0) out.tags = tags;
  }
  return out;
}

/**
 * Checks an untrusted, already-parsed share payload (version 1 or 2) and returns a clean version 2
 * copy, or null if it isn't a usable sequence. Optional fields that are malformed are dropped; a
 * missing or malformed required field rejects the whole payload.
 */
export function validateSharePayload(raw: unknown): SharePayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const payload = raw as Record<string, unknown>;
  if (payload.v !== 1 && payload.v !== 2) return null;
  const version = payload.v;

  const name = cleanString(payload.name, MAX_NAME_LENGTH);
  if (!name || !Array.isArray(payload.sections)) return null;
  if (payload.sections.length === 0 || payload.sections.length > MAX_SECTIONS) return null;

  const { icons, newIndex } = cleanIcons(version === 2 ? payload.icons : undefined);
  const sections: ShareSection[] = [];
  let exerciseCount = 0;
  for (const rawSection of payload.sections) {
    if (typeof rawSection !== 'object' || rawSection === null) return null;
    const section = rawSection as Record<string, unknown>;
    if (!Array.isArray(section.exercises)) return null;

    const exercises: ShareExercise[] = [];
    for (const rawExercise of section.exercises) {
      const exercise = cleanExercise(rawExercise, version, newIndex);
      if (!exercise) return null;
      exercises.push(exercise);
    }
    exerciseCount += exercises.length;
    if (exerciseCount > MAX_EXERCISES) return null;

    sections.push({ name: cleanString(section.name, MAX_NAME_LENGTH) ?? 'Section', exercises });
  }

  return icons.length > 0 ? { v: 2, name, icons, sections } : { v: 2, name, sections };
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function parsePayload(json: string | null): SharePayload | null {
  if (!json) return null;
  try {
    return validateSharePayload(JSON.parse(json));
  } catch {
    return null;
  }
}

export function decodeShareData(data: string | undefined): SharePayload | null {
  if (!data) return null;

  let candidate = data.trim();

  // Handle a full cue:// (or legacy traintrack://) URL pasted from clipboard
  if (candidate.startsWith('cue://') || candidate.startsWith('traintrack://')) {
    const match = candidate.match(/[?&]data=([^&\s]*)/);
    const decoded = match ? safeDecodeURIComponent(match[1]) : null;
    if (!decoded) return null;
    candidate = decoded;
  }

  // Try direct JSON parse (expo-router already decoded the param, or we decoded above),
  // then fall back to decoding first in case the param arrived still-encoded.
  return parsePayload(candidate) ?? parsePayload(safeDecodeURIComponent(candidate));
}

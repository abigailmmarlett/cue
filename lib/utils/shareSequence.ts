import { getSequenceById, createSequence } from '../db/sequences';
import { getSectionsBySequenceId, createSection } from '../db/sections';
import { getExercisesBySectionId } from '../db/exercises';
import { getTagsForExercise } from '../db/tags';
import { generateId } from './id';
import db, { transaction } from '../db/client';

function findOrCreateTagValue(categoryName: string, label: string): string {
  let category = db.getFirstSync<{ id: string }>(`SELECT id FROM tag_categories WHERE name = ?;`, [categoryName]);
  if (!category) {
    const id = generateId();
    db.runSync(`INSERT INTO tag_categories (id, name, created_at) VALUES (?, ?, ?);`, [id, categoryName, Date.now()]);
    category = { id };
  }
  let tagValue = db.getFirstSync<{ id: string }>(`SELECT id FROM tag_values WHERE category_id = ? AND label = ?;`, [
    category.id,
    label,
  ]);
  if (!tagValue) {
    const id = generateId();
    db.runSync(`INSERT INTO tag_values (id, category_id, label, created_at) VALUES (?, ?, ?, ?);`, [
      id,
      category.id,
      label,
      Date.now(),
    ]);
    tagValue = { id };
  }
  return tagValue.id;
}

interface ShareExercise {
  name: string;
  duration: number;
  notes?: string;
  variation?: string;
  side?: 'left' | 'right';
  is_bilateral?: 1;
  load_base?: string;
  load_modified?: string;
  load_amplified?: string;
  tags?: { c: string; l: string }[];
}

interface ShareSection {
  name: string;
  exercises: ShareExercise[];
}

export interface SharePayload {
  v: 1;
  name: string;
  sections: ShareSection[];
}

export function serializeSequence(id: string): SharePayload {
  const sequence = getSequenceById(id);
  if (!sequence) throw new Error(`Sequence ${id} not found`);

  const sections = getSectionsBySequenceId(id);

  return {
    v: 1,
    name: sequence.name,
    sections: sections.map((section) => {
      const exercises = getExercisesBySectionId(section.id);
      return {
        name: section.name,
        exercises: exercises.map((ex) => {
          const tags = getTagsForExercise(ex.id);
          const out: ShareExercise = { name: ex.name, duration: ex.duration };
          if (ex.notes) out.notes = ex.notes;
          if (ex.variation) out.variation = ex.variation;
          if (ex.side) out.side = ex.side;
          if (ex.is_bilateral) out.is_bilateral = 1;
          if (ex.load_base) out.load_base = ex.load_base;
          if (ex.load_modified) out.load_modified = ex.load_modified;
          if (ex.load_amplified) out.load_amplified = ex.load_amplified;
          if (tags.length > 0) {
            out.tags = tags.map((t) => ({ c: t.categoryName, l: t.label }));
          }
          return out;
        }),
      };
    }),
  };
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
const MAX_DURATION_SECONDS = 24 * 60 * 60;

function cleanString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function cleanLoad(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((id) => typeof id === 'string')) return value;
  } catch {
    /* invalid load; drop it */
  }
  return undefined;
}

function cleanExercise(raw: unknown): ShareExercise | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const ex = raw as Record<string, unknown>;
  const name = cleanString(ex.name, MAX_NAME_LENGTH);
  const duration = typeof ex.duration === 'number' ? Math.round(ex.duration) : NaN;
  if (!name || !Number.isFinite(duration)) return null;

  const out: ShareExercise = { name, duration: Math.min(Math.max(duration, 1), MAX_DURATION_SECONDS) };
  const notes = cleanString(ex.notes, MAX_TEXT_LENGTH);
  if (notes) out.notes = notes;
  const variation = cleanString(ex.variation, MAX_TEXT_LENGTH);
  if (variation) out.variation = variation;
  if (ex.side === 'left' || ex.side === 'right') out.side = ex.side;
  const loadBase = cleanLoad(ex.load_base);
  if (loadBase) out.load_base = loadBase;
  const loadModified = cleanLoad(ex.load_modified);
  if (loadModified) out.load_modified = loadModified;
  const loadAmplified = cleanLoad(ex.load_amplified);
  if (loadAmplified) out.load_amplified = loadAmplified;

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
 * Checks an untrusted, already-parsed share payload and returns a clean copy,
 * or null if it isn't a usable sequence. Optional fields that are malformed are
 * dropped; a missing or malformed required field rejects the whole payload.
 */
export function validateSharePayload(raw: unknown): SharePayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const payload = raw as Record<string, unknown>;
  if (payload.v !== 1) return null;

  const name = cleanString(payload.name, MAX_NAME_LENGTH);
  if (!name || !Array.isArray(payload.sections)) return null;
  if (payload.sections.length === 0 || payload.sections.length > MAX_SECTIONS) return null;

  const sections: ShareSection[] = [];
  let exerciseCount = 0;
  for (const rawSection of payload.sections) {
    if (typeof rawSection !== 'object' || rawSection === null) return null;
    const section = rawSection as Record<string, unknown>;
    if (!Array.isArray(section.exercises)) return null;

    const exercises: ShareExercise[] = [];
    for (const rawExercise of section.exercises) {
      const exercise = cleanExercise(rawExercise);
      if (!exercise) return null;
      exercises.push(exercise);
    }
    exerciseCount += exercises.length;
    if (exerciseCount > MAX_EXERCISES) return null;

    sections.push({ name: cleanString(section.name, MAX_NAME_LENGTH) ?? 'Section', exercises });
  }

  return { v: 1, name, sections };
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

export function importSharedSequence(payload: SharePayload): string {
  return transaction(() => insertSharedSequence(payload));
}

function insertSharedSequence(payload: SharePayload): string {
  const sequence = createSequence(payload.name);

  for (const sec of payload.sections) {
    const section = createSection(sequence.id, sec.name);

    for (let i = 0; i < sec.exercises.length; i++) {
      const ex = sec.exercises[i];
      const exId = generateId();
      const now = Date.now();
      db.runSync(
        `INSERT INTO exercises (id, sequence_id, section_id, name, duration, order_index, notes, created_at, load_base, load_modified, load_amplified, variation, side)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          exId,
          sequence.id,
          section.id,
          ex.name,
          ex.duration,
          i,
          ex.notes ?? null,
          now,
          ex.load_base ?? null,
          ex.load_modified ?? null,
          ex.load_amplified ?? null,
          ex.variation ?? null,
          ex.side ?? null,
        ]
      );
      if (ex.tags && ex.tags.length > 0) {
        for (const tag of ex.tags) {
          const tagValueId = findOrCreateTagValue(tag.c, tag.l);
          db.runSync(`INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_value_id) VALUES (?, ?);`, [
            exId,
            tagValueId,
          ]);
        }
      }
    }
  }

  return sequence.id;
}

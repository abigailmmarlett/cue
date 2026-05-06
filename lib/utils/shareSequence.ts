import { getSequenceById, createSequence } from '../db/sequences';
import { getSectionsBySequenceId, createSection } from '../db/sections';
import { getExercisesBySectionId } from '../db/exercises';
import { getTagsForExercise } from '../db/tags';
import { generateId } from './id';
import db from '../db/client';

function findOrCreateTagValue(categoryName: string, label: string): string {
  let category = db.getFirstSync<{ id: string }>(
    `SELECT id FROM tag_categories WHERE name = ?;`, [categoryName]
  );
  if (!category) {
    const id = generateId();
    db.runSync(
      `INSERT INTO tag_categories (id, name, created_at) VALUES (?, ?, ?);`,
      [id, categoryName, Date.now()]
    );
    category = { id };
  }
  let tagValue = db.getFirstSync<{ id: string }>(
    `SELECT id FROM tag_values WHERE category_id = ? AND label = ?;`,
    [category.id, label]
  );
  if (!tagValue) {
    const id = generateId();
    db.runSync(
      `INSERT INTO tag_values (id, category_id, label, created_at) VALUES (?, ?, ?, ?);`,
      [id, category.id, label, Date.now()]
    );
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
  tags?: Array<{ c: string; l: string }>;
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
  return `traintrack://import?data=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function decodeShareData(data: string | undefined): SharePayload | null {
  if (!data) return null;

  let candidate = data.trim();

  // Handle a full traintrack:// URL pasted from clipboard
  if (candidate.startsWith('traintrack://')) {
    const match = candidate.match(/[?&]data=([^&\s]*)/);
    candidate = match ? decodeURIComponent(match[1]) : '';
    if (!candidate) return null;
  }

  // Try direct JSON parse (expo-router already decoded the param, or we decoded above)
  try {
    const parsed = JSON.parse(candidate);
    if (parsed?.v === 1 && typeof parsed.name === 'string' && Array.isArray(parsed.sections)) {
      return parsed as SharePayload;
    }
  } catch { /* fall through */ }

  // Fallback: try decoding first in case the param arrived still-encoded
  try {
    const parsed = JSON.parse(decodeURIComponent(candidate));
    if (parsed?.v === 1 && typeof parsed.name === 'string' && Array.isArray(parsed.sections)) {
      return parsed as SharePayload;
    }
  } catch { /* fall through */ }

  return null;
}

export function importSharedSequence(payload: SharePayload): string {
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
          db.runSync(
            `INSERT OR IGNORE INTO exercise_tags (exercise_id, tag_value_id) VALUES (?, ?);`,
            [exId, tagValueId]
          );
        }
      }
    }
  }

  return sequence.id;
}

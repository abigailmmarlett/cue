import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSequenceById, type Sequence } from '../db/sequences';
import { getExercisesBySequenceId, type Exercise } from '../db/exercises';
import { getSectionsBySequenceId, type Section } from '../db/sections';
import { getTagsForSequenceExercises, type ExerciseTag } from '../db/tags';

export type ExerciseWithTags = Exercise & { tags: ExerciseTag[] };
export type SectionWithExercises = Section & { exercises: ExerciseWithTags[] };

interface SequenceData {
  sequence: Sequence | null;
  sections: SectionWithExercises[];
  exercises: ExerciseWithTags[];
}

const EMPTY: SequenceData = { sequence: null, sections: [], exercises: [] };

function loadSequence(id: string): SequenceData {
  const tags = getTagsForSequenceExercises(id);
  const exercises = getExercisesBySequenceId(id).map((e) => ({ ...e, tags: tags.get(e.id) ?? [] }));
  const sections = getSectionsBySequenceId(id).map((s) => ({
    ...s,
    exercises: exercises.filter((e) => e.section_id === s.id),
  }));
  return { sequence: getSequenceById(id), sections, exercises };
}

/** Loads a sequence with its sections, exercises and tags, and reloads it each time the screen comes into focus. */
export function useSequence(id: string) {
  const [data, setData] = useState<SequenceData | null>(null);
  const refresh = useCallback(() => setData(loadSequence(id)), [id]);
  useFocusEffect(refresh);

  return { ...(data ?? EMPTY), loading: data === null, refresh };
}

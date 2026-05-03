import { useState, useEffect, useCallback } from 'react';
import { getSequenceById, type Sequence } from '../db/sequences';
import { getExercisesBySequenceId, getExercisesBySectionId, type Exercise } from '../db/exercises';
import { getSectionsBySequenceId, type Section } from '../db/sections';
import { getTagsForExercise, type ExerciseTag } from '../db/tags';

export type ExerciseWithTags = Exercise & { tags: ExerciseTag[] };
export type SectionWithExercises = Section & { exercises: ExerciseWithTags[] };

export function useSequence(id: string) {
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [sections, setSections] = useState<SectionWithExercises[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithTags[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setSequence(getSequenceById(id));
    const rawSections = getSectionsBySequenceId(id);
    const sectionsWithExercises = rawSections.map((s) => ({
      ...s,
      exercises: getExercisesBySectionId(s.id).map((e) => ({
        ...e,
        tags: getTagsForExercise(e.id),
      })),
    }));
    setSections(sectionsWithExercises);
    setExercises(
      getExercisesBySequenceId(id).map((e) => ({
        ...e,
        tags: getTagsForExercise(e.id),
      }))
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sequence, sections, exercises, loading, refresh };
}

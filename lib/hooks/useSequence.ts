import { useState, useEffect, useCallback } from 'react';
import { getSequenceById, type Sequence } from '../db/sequences';
import { getExercisesBySequenceId, getExercisesBySectionId, type Exercise } from '../db/exercises';
import { getSectionsBySequenceId, type Section } from '../db/sections';

export type SectionWithExercises = Section & { exercises: Exercise[] };

export function useSequence(id: string) {
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [sections, setSections] = useState<SectionWithExercises[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setSequence(getSequenceById(id));
    const rawSections = getSectionsBySequenceId(id);
    const sectionsWithExercises = rawSections.map((s) => ({
      ...s,
      exercises: getExercisesBySectionId(s.id),
    }));
    setSections(sectionsWithExercises);
    setExercises(getExercisesBySequenceId(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sequence, sections, exercises, loading, refresh };
}

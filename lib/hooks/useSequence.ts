import { useState, useEffect, useCallback } from 'react';
import { getSequenceById, type Sequence } from '../db/sequences';
import { getExercisesBySequenceId, type Exercise } from '../db/exercises';

export function useSequence(id: string) {
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setSequence(getSequenceById(id));
    setExercises(getExercisesBySequenceId(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sequence, exercises, loading, refresh };
}

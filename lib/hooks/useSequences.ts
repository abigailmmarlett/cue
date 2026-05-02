import { useState, useEffect, useCallback } from 'react';
import { getAllSequences, type SequenceWithMeta } from '../db/sequences';
import { onSequenceChange } from '../sequenceEvents';

export function useSequences() {
  const [sequences, setSequences] = useState<SequenceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setSequences(getAllSequences());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    return onSequenceChange(refresh);
  }, [refresh]);

  return { sequences, loading, refresh };
}

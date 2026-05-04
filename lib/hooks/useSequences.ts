import { useState, useEffect, useCallback } from 'react';
import { getAllSequences, type SequenceWithTags } from '../db/sequences';
import { getAllSequenceTags } from '../db/tags';
import { onSequenceChange } from '../sequenceEvents';

export function useSequences() {
  const [sequences, setSequences] = useState<SequenceWithTags[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const seqs = getAllSequences();
    const tagsMap = getAllSequenceTags();
    setSequences(seqs.map((s) => ({ ...s, tags: tagsMap.get(s.id) ?? [] })));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    return onSequenceChange(refresh);
  }, [refresh]);

  return { sequences, loading, refresh };
}

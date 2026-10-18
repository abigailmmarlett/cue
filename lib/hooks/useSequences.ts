import { useState, useEffect, useCallback } from 'react';
import { getAllSequences, type SequenceWithTags } from '../db/sequences';
import { getAllSequenceTags } from '../db/tags';
import { onSequenceChange } from '../sequenceEvents';

function readSequences(): SequenceWithTags[] {
  const tagsMap = getAllSequenceTags();
  return getAllSequences().map((s) => ({ ...s, tags: tagsMap.get(s.id) ?? [] }));
}

export function useSequences() {
  const [sequences, setSequences] = useState(readSequences);

  const refresh = useCallback(() => setSequences(readSequences()), []);

  useEffect(() => onSequenceChange(refresh), [refresh]);

  return { sequences, refresh };
}

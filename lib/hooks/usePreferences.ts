import { useState } from 'react';
import { getPreference, setPreference } from '@/lib/db/preferences';

export function usePreferences() {
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => {
    const val = getPreference('hapticsEnabled');
    return val === null ? true : val === 'true';
  });

  const [showExerciseNotes, setShowExerciseNotesState] = useState<boolean>(() => {
    const val = getPreference('showExerciseNotes');
    return val === null ? true : val === 'true';
  });

  const setHapticsEnabled = (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    setPreference('hapticsEnabled', String(enabled));
  };

  const setShowExerciseNotes = (show: boolean) => {
    setShowExerciseNotesState(show);
    setPreference('showExerciseNotes', String(show));
  };

  return { hapticsEnabled, setHapticsEnabled, showExerciseNotes, setShowExerciseNotes };
}

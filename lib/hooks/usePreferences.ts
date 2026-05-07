import { useState } from 'react';
import { getPreference, setPreference } from '@/lib/db/preferences';

export type HapticStyle =
  | 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
  | 'success' | 'warning' | 'error';

export interface BasicEvent {
  enabled: boolean;
  style: HapticStyle;
}

export interface CountdownWarning {
  seconds: number;
  style: HapticStyle;
}

export interface CountdownEvent {
  enabled: boolean;
  timing: 'at_transition' | 'countdown';
  secondsBefore: number;
  style: HapticStyle;
}

export interface HapticSettings {
  enabled: boolean;
  onExerciseTransition: BasicEvent;
  onSectionTransition: BasicEvent;
  onCompletion: BasicEvent;
  onMark: BasicEvent;
  countdownWarnings: CountdownWarning[];
  onLoadChange: CountdownEvent;
  onSideChange: CountdownEvent;
  onVariationChange: CountdownEvent;
}

export const DEFAULT_HAPTIC_SETTINGS: HapticSettings = {
  enabled: true,
  onExerciseTransition: { enabled: true, style: 'success' },
  onSectionTransition: { enabled: true, style: 'medium' },
  onCompletion: { enabled: true, style: 'success' },
  onMark: { enabled: true, style: 'light' },
  countdownWarnings: [],
  onLoadChange: { enabled: false, timing: 'countdown', secondsBefore: 20, style: 'heavy' },
  onSideChange: { enabled: false, timing: 'countdown', secondsBefore: 15, style: 'heavy' },
  onVariationChange: { enabled: false, timing: 'at_transition', secondsBefore: 0, style: 'heavy' },
};

function loadHapticSettings(): HapticSettings {
  const raw = getPreference('hapticSettings');
  if (!raw) return DEFAULT_HAPTIC_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    // Deep-merge: top-level object fields override defaults, nested objects merge with their defaults
    return {
      ...DEFAULT_HAPTIC_SETTINGS,
      ...parsed,
      onExerciseTransition: { ...DEFAULT_HAPTIC_SETTINGS.onExerciseTransition, ...(parsed.onExerciseTransition ?? {}) },
      onSectionTransition: { ...DEFAULT_HAPTIC_SETTINGS.onSectionTransition, ...(parsed.onSectionTransition ?? {}) },
      onCompletion: { ...DEFAULT_HAPTIC_SETTINGS.onCompletion, ...(parsed.onCompletion ?? {}) },
      onMark: { ...DEFAULT_HAPTIC_SETTINGS.onMark, ...(parsed.onMark ?? {}) },
      onLoadChange: { ...DEFAULT_HAPTIC_SETTINGS.onLoadChange, ...(parsed.onLoadChange ?? {}) },
      onSideChange: { ...DEFAULT_HAPTIC_SETTINGS.onSideChange, ...(parsed.onSideChange ?? {}) },
      onVariationChange: { ...DEFAULT_HAPTIC_SETTINGS.onVariationChange, ...(parsed.onVariationChange ?? {}) },
    };
  } catch {
    return DEFAULT_HAPTIC_SETTINGS;
  }
}

export function usePreferences() {
  const [showExerciseNotes, setShowExerciseNotesState] = useState<boolean>(() => {
    const val = getPreference('showExerciseNotes');
    return val === null ? true : val === 'true';
  });

  const [hapticSettings, setHapticSettingsState] = useState<HapticSettings>(loadHapticSettings);

  const setShowExerciseNotes = (show: boolean) => {
    setShowExerciseNotesState(show);
    setPreference('showExerciseNotes', String(show));
  };

  const setHapticSettings = (settings: HapticSettings) => {
    setHapticSettingsState(settings);
    setPreference('hapticSettings', JSON.stringify(settings));
  };

  return {
    hapticsEnabled: hapticSettings.enabled,
    setHapticsEnabled: (enabled: boolean) => setHapticSettings({ ...hapticSettings, enabled }),
    showExerciseNotes,
    setShowExerciseNotes,
    hapticSettings,
    setHapticSettings,
  };
}

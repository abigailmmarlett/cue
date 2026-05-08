import { useState, useEffect } from 'react';
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

export type ActionButtonSize = 'small' | 'default' | 'large';
export type TextSize = 'small' | 'default' | 'large';

export const ACTION_BUTTON_SCALE: Record<ActionButtonSize, number> = { small: 0.6, default: 1.0, large: 1.65 };
export const TEXT_SCALE: Record<TextSize, number> = { small: 1.0, default: 1.2, large: 1.5 };

function toActionButtonSize(raw: string | null): ActionButtonSize {
  if (raw === 'small' || raw === 'default' || raw === 'large') return raw;
  return 'default';
}

function toTextSize(raw: string | null): TextSize {
  if (raw === 'small' || raw === 'default' || raw === 'large') return raw;
  return 'default';
}

// Module-level stores so all hook instances share one value and re-render together.
let _actionButtonSize: ActionButtonSize = toActionButtonSize(getPreference('actionButtonSize'));
const _absListeners = new Set<(v: ActionButtonSize) => void>();

function _setActionButtonSize(size: ActionButtonSize) {
  _actionButtonSize = size;
  setPreference('actionButtonSize', size);
  _absListeners.forEach((fn) => fn(size));
}

export function useActionButtonSize(): ActionButtonSize {
  const [size, setSize] = useState<ActionButtonSize>(() => _actionButtonSize);
  useEffect(() => {
    _absListeners.add(setSize);
    return () => { _absListeners.delete(setSize); };
  }, []);
  return size;
}

let _textSize: TextSize = toTextSize(getPreference('textSize'));
const _tsListeners = new Set<(v: TextSize) => void>();

function _setTextSize(size: TextSize) {
  _textSize = size;
  setPreference('textSize', size);
  _tsListeners.forEach((fn) => fn(size));
}

export function useTextSize(): TextSize {
  const [size, setSize] = useState<TextSize>(() => _textSize);
  useEffect(() => {
    _tsListeners.add(setSize);
    return () => { _tsListeners.delete(setSize); };
  }, []);
  return size;
}

export function usePreferences() {
  const [showExerciseNotes, setShowExerciseNotesState] = useState<boolean>(() => {
    const val = getPreference('showExerciseNotes');
    return val === null ? true : val === 'true';
  });

  const [hapticSettings, setHapticSettingsState] = useState<HapticSettings>(loadHapticSettings);

  const [actionButtonSize, setActionButtonSizeState] = useState<ActionButtonSize>(
    () => _actionButtonSize
  );

  const [textSize, setTextSizeState] = useState<TextSize>(() => _textSize);

  // Keep local state in sync with module-level stores (in case another caller changed them).
  useEffect(() => {
    _absListeners.add(setActionButtonSizeState);
    _tsListeners.add(setTextSizeState);
    return () => {
      _absListeners.delete(setActionButtonSizeState);
      _tsListeners.delete(setTextSizeState);
    };
  }, []);

  const setShowExerciseNotes = (show: boolean) => {
    setShowExerciseNotesState(show);
    setPreference('showExerciseNotes', String(show));
  };

  const setHapticSettings = (settings: HapticSettings) => {
    setHapticSettingsState(settings);
    setPreference('hapticSettings', JSON.stringify(settings));
  };

  const setActionButtonSize = (size: ActionButtonSize) => {
    _setActionButtonSize(size);
  };

  const setTextSize = (size: TextSize) => {
    _setTextSize(size);
  };

  return {
    hapticsEnabled: hapticSettings.enabled,
    setHapticsEnabled: (enabled: boolean) => setHapticSettings({ ...hapticSettings, enabled }),
    showExerciseNotes,
    setShowExerciseNotes,
    hapticSettings,
    setHapticSettings,
    actionButtonSize,
    setActionButtonSize,
    textSize,
    setTextSize,
  };
}

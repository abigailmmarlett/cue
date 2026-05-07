import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import type { TimerExercise, TimerStatus } from './useTimer';
import type { HapticSettings, HapticStyle } from './usePreferences';

interface HapticTimerState {
  status: TimerStatus;
  exerciseIndex: number;
  timeRemaining: number;
  currentExercise: TimerExercise | null;
  nextExercise: TimerExercise | null;
  currentSectionIndex: number;
}

export function fireHaptic(style: HapticStyle): void {
  switch (style) {
    case 'light':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case 'medium':  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case 'heavy':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    case 'rigid':   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid); break;
    case 'soft':    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft); break;
    case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
    case 'error':   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
  }
}

function hasLoadChanged(a: TimerExercise | null, b: TimerExercise | null): boolean {
  return (
    JSON.stringify(a?.loadModified) !== JSON.stringify(b?.loadModified) ||
    JSON.stringify(a?.loadBase) !== JSON.stringify(b?.loadBase) ||
    JSON.stringify(a?.loadAmplified) !== JSON.stringify(b?.loadAmplified)
  );
}

function hasSideChanged(a: TimerExercise | null, b: TimerExercise | null): boolean {
  return a?.side !== b?.side;
}

function hasVariationChanged(a: TimerExercise | null, b: TimerExercise | null): boolean {
  return a?.variation !== b?.variation;
}

export function useHapticFeedback(state: HapticTimerState, settings: HapticSettings): void {
  const { status, exerciseIndex, timeRemaining, currentExercise, nextExercise, currentSectionIndex } = state;

  const prevSectionIndexRef = useRef<number>(-1);
  const prevExerciseRef = useRef<TimerExercise | null>(null);
  const firedThisExerciseRef = useRef<Set<string>>(new Set());
  const armedCountdownsRef = useRef<Set<string>>(new Set());

  // Reset refs and fire transition haptics when exercise changes
  useEffect(() => {
    if (status !== 'running') return;

    firedThisExerciseRef.current = new Set();

    const duration = currentExercise?.duration ?? 0;
    armedCountdownsRef.current = new Set([
      ...settings.countdownWarnings.filter((w) => duration > w.seconds).map((w) => `countdown_${w.seconds}`),
      ...(settings.onLoadChange.enabled && settings.onLoadChange.timing === 'countdown' && duration > settings.onLoadChange.secondsBefore ? ['loadChange'] : []),
      ...(settings.onSideChange.enabled && settings.onSideChange.timing === 'countdown' && duration > settings.onSideChange.secondsBefore ? ['sideChange'] : []),
      ...(settings.onVariationChange.enabled && settings.onVariationChange.timing === 'countdown' && duration > settings.onVariationChange.secondsBefore ? ['variationChange'] : []),
    ]);

    if (exerciseIndex > 0 && settings.enabled) {
      if (settings.onExerciseTransition.enabled) {
        fireHaptic(settings.onExerciseTransition.style);
      }

      const prev = prevExerciseRef.current;

      if (settings.onSectionTransition.enabled && currentSectionIndex !== prevSectionIndexRef.current) {
        fireHaptic(settings.onSectionTransition.style);
      }

      if (settings.onLoadChange.enabled && settings.onLoadChange.timing === 'at_transition') {
        if (hasLoadChanged(prev, currentExercise)) fireHaptic(settings.onLoadChange.style);
      }
      if (settings.onSideChange.enabled && settings.onSideChange.timing === 'at_transition') {
        if (hasSideChanged(prev, currentExercise)) fireHaptic(settings.onSideChange.style);
      }
      if (settings.onVariationChange.enabled && settings.onVariationChange.timing === 'at_transition') {
        if (hasVariationChanged(prev, currentExercise)) fireHaptic(settings.onVariationChange.style);
      }
    }

    prevSectionIndexRef.current = currentSectionIndex;
    prevExerciseRef.current = currentExercise;
  }, [exerciseIndex, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Completion haptic
  useEffect(() => {
    if (status === 'finished' && settings.enabled && settings.onCompletion.enabled) {
      fireHaptic(settings.onCompletion.style);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown warnings and countdown-mode contextual alerts
  useEffect(() => {
    if (status !== 'running' || !settings.enabled) return;
    const fired = firedThisExerciseRef.current;
    const armed = armedCountdownsRef.current;

    for (const warning of settings.countdownWarnings) {
      const key = `countdown_${warning.seconds}`;
      if (timeRemaining <= warning.seconds && armed.has(key) && !fired.has(key)) {
        fired.add(key);
        fireHaptic(warning.style);
      }
    }

    if (
      settings.onLoadChange.enabled &&
      settings.onLoadChange.timing === 'countdown' &&
      timeRemaining <= settings.onLoadChange.secondsBefore &&
      armed.has('loadChange') && !fired.has('loadChange') &&
      hasLoadChanged(currentExercise, nextExercise)
    ) {
      fired.add('loadChange');
      fireHaptic(settings.onLoadChange.style);
    }

    if (
      settings.onSideChange.enabled &&
      settings.onSideChange.timing === 'countdown' &&
      timeRemaining <= settings.onSideChange.secondsBefore &&
      armed.has('sideChange') && !fired.has('sideChange') &&
      hasSideChanged(currentExercise, nextExercise)
    ) {
      fired.add('sideChange');
      fireHaptic(settings.onSideChange.style);
    }

    if (
      settings.onVariationChange.enabled &&
      settings.onVariationChange.timing === 'countdown' &&
      timeRemaining <= settings.onVariationChange.secondsBefore &&
      armed.has('variationChange') && !fired.has('variationChange') &&
      hasVariationChanged(currentExercise, nextExercise)
    ) {
      fired.add('variationChange');
      fireHaptic(settings.onVariationChange.style);
    }
  }, [timeRemaining, status]); // eslint-disable-line react-hooks/exhaustive-deps
}

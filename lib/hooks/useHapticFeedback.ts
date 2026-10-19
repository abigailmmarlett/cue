import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import type { TimerExercise, TimerStatus } from './useTimer';
import type { HapticSettings, HapticStyle } from './usePreferences';
import { computeVariationFractions } from '@/lib/db/exercises';

interface HapticTimerState {
  status: TimerStatus;
  exerciseIndex: number;
  timeRemaining: number;
  currentExercise: TimerExercise | null;
  nextExercise: TimerExercise | null;
  currentSectionIndex: number;
  runId: number;
}

export function fireHaptic(style: HapticStyle): void {
  switch (style) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'rigid':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      break;
    case 'soft':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      break;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}

// These compare an exercise with the next one. At the end of the workout there's no next one, so
// nothing changes.

// No load and an emptied one look the same.
const loadKey = (ids: string[] | null) => ids?.join(',') ?? '';

function hasLoadChanged(a: TimerExercise | null, b: TimerExercise | null): boolean {
  if (!a || !b) return false;
  return (
    loadKey(a.loadModified) !== loadKey(b.loadModified) ||
    loadKey(a.loadBase) !== loadKey(b.loadBase) ||
    loadKey(a.loadAmplified) !== loadKey(b.loadAmplified)
  );
}

function hasSideChanged(a: TimerExercise | null, b: TimerExercise | null): boolean {
  return !!a && !!b && a.side !== b.side;
}

function hasVariationChanged(a: TimerExercise | null, b: TimerExercise | null): boolean {
  return !!a && !!b && a.variation !== b.variation;
}

export function useHapticFeedback(state: HapticTimerState, settings: HapticSettings): void {
  const { status, exerciseIndex, timeRemaining, currentExercise, nextExercise, currentSectionIndex, runId } = state;

  const prevSectionIndexRef = useRef<number>(-1);
  const prevExerciseRef = useRef<TimerExercise | null>(null);
  const firedThisExerciseRef = useRef<Set<string>>(new Set());
  const armedCountdownsRef = useRef<Set<string>>(new Set());
  const armedKeyRef = useRef<string | null>(null);

  // Reset refs and fire transition haptics when exercise changes
  useEffect(() => {
    // Resuming after a pause continues the same run of the same exercise, so don't buzz again or
    // re-fire countdowns. Start, Skip and Back change runId, so a restarted exercise re-arms.
    const key = `${runId}:${exerciseIndex}`;
    if (status !== 'running' || armedKeyRef.current === key) return;
    armedKeyRef.current = key;

    firedThisExerciseRef.current = new Set();

    const duration = currentExercise?.duration ?? 0;
    const variationMarkKeys: string[] = [];
    if (currentExercise?.variationSets?.length) {
      const fractions = computeVariationFractions(currentExercise.variationSets, duration);
      fractions.forEach((f, i) => {
        const threshold = (1 - f) * duration;
        if (threshold > 0) variationMarkKeys.push(`variationMark_${i}_${threshold}`);
      });
    }
    armedCountdownsRef.current = new Set([
      ...settings.countdownWarnings.filter((w) => duration > w.seconds).map((w) => `countdown_${w.seconds}`),
      ...(settings.onLoadChange.enabled &&
      settings.onLoadChange.timing === 'countdown' &&
      duration > settings.onLoadChange.secondsBefore
        ? ['loadChange']
        : []),
      ...(settings.onSideChange.enabled &&
      settings.onSideChange.timing === 'countdown' &&
      duration > settings.onSideChange.secondsBefore
        ? ['sideChange']
        : []),
      ...(settings.onVariationChange.enabled &&
      settings.onVariationChange.timing === 'countdown' &&
      duration > settings.onVariationChange.secondsBefore
        ? ['variationChange']
        : []),
      ...variationMarkKeys,
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
  }, [runId, exerciseIndex, status]); // eslint-disable-line react-hooks/exhaustive-deps

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
      armed.has('loadChange') &&
      !fired.has('loadChange') &&
      hasLoadChanged(currentExercise, nextExercise)
    ) {
      fired.add('loadChange');
      fireHaptic(settings.onLoadChange.style);
    }

    if (
      settings.onSideChange.enabled &&
      settings.onSideChange.timing === 'countdown' &&
      timeRemaining <= settings.onSideChange.secondsBefore &&
      armed.has('sideChange') &&
      !fired.has('sideChange') &&
      hasSideChanged(currentExercise, nextExercise)
    ) {
      fired.add('sideChange');
      fireHaptic(settings.onSideChange.style);
    }

    if (
      settings.onVariationChange.enabled &&
      settings.onVariationChange.timing === 'countdown' &&
      timeRemaining <= settings.onVariationChange.secondsBefore &&
      armed.has('variationChange') &&
      !fired.has('variationChange') &&
      hasVariationChanged(currentExercise, nextExercise)
    ) {
      fired.add('variationChange');
      fireHaptic(settings.onVariationChange.style);
    }

    if (currentExercise?.variationSets?.length) {
      const duration = currentExercise.duration;
      const fractions = computeVariationFractions(currentExercise.variationSets, duration);
      fractions.forEach((f, i) => {
        const threshold = (1 - f) * duration;
        const key = `variationMark_${i}_${threshold}`;
        if (timeRemaining <= threshold && armed.has(key) && !fired.has(key)) {
          fired.add(key);
          fireHaptic(settings.onVariationChange.style);
        }
      });
    }
  }, [timeRemaining, status]); // eslint-disable-line react-hooks/exhaustive-deps
}

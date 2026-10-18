import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import type { VariationItem } from '@/lib/db/exercises';
import { positionAfter } from '@/lib/utils/time';

export interface TimerExercise {
  id: string;
  name: string;
  duration: number;
  sectionId: string;
  notes?: string | null;
  tags: { tagValueId: string; categoryName: string; label: string }[];
  loadModified: string[] | null;
  loadBase: string[] | null;
  loadAmplified: string[] | null;
  variation: string | null;
  variationSets: VariationItem[] | null;
  side: 'left' | 'right' | null;
  libraryExerciseId?: string | null;
}

export interface TimerSection {
  id: string;
  name: string;
  duration: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  status: TimerStatus;
  exerciseIndex: number;
  timeRemaining: number;
  currentExercise: TimerExercise | null;
  nextExercise: TimerExercise | null;
  totalExercises: number;
  currentSectionIndex: number;
  currentSection: TimerSection | null;
  sectionTimeRemaining: number;
  /** Changes whenever an exercise starts over from the top (Start, Skip, Back), but not on Resume. */
  runId: number;
}

export interface TimerControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  goBack: () => void;
  reset: () => void;
}

function computeSectionTimeRemaining(exercises: TimerExercise[], exerciseIndex: number, timeRemaining: number): number {
  const sectionId = exercises[exerciseIndex]?.sectionId ?? '';
  let total = timeRemaining;
  for (let i = exerciseIndex + 1; i < exercises.length; i++) {
    if (exercises[i].sectionId !== sectionId) break;
    total += exercises[i].duration;
  }
  return total;
}

export function useTimer(
  exercises: TimerExercise[],
  sections: TimerSection[]
): TimerState & { controls: TimerControls } {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [runId, setRunId] = useState(0);

  const exercisesRef = useRef(exercises);
  const statusRef = useRef<TimerStatus>('idle');
  const indexRef = useRef(0);
  // While running: the Date.now() at which the current exercise started, shifted forward by any time spent paused.
  const startedAtRef = useRef(0);
  // While paused: how far into the current exercise the timer got, in milliseconds.
  const pausedMsRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  const clearTick = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const updateStatus = useCallback((next: TimerStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const show = useCallback((index: number, elapsedMs: number) => {
    indexRef.current = index;
    setExerciseIndex(index);
    setElapsedSeconds(Math.floor(elapsedMs / 1000));
  }, []);

  const finish = useCallback(() => {
    clearTick();
    const last = exercisesRef.current.length - 1;
    show(Math.max(0, last), (exercisesRef.current[last]?.duration ?? 0) * 1000);
    updateStatus('finished');
  }, [clearTick, show, updateStatus]);

  // Works the position out from the clock rather than counting ticks, so time that passed while the
  // app was in the background (when timers don't fire) is caught up instead of lost.
  const sync = useCallback(() => {
    const tick = () => {
      clearTick();
      if (statusRef.current !== 'running') return;
      const now = Date.now();
      const pos = positionAfter(exercisesRef.current, indexRef.current, now - startedAtRef.current);
      if (!pos) {
        finish();
        return;
      }
      startedAtRef.current = now - pos.elapsedMs;
      show(pos.index, pos.elapsedMs);
      // Wake just after the next whole second instead of polling.
      timeoutRef.current = setTimeout(tick, 1000 - (pos.elapsedMs % 1000) + 5);
    };
    tick();
  }, [clearTick, finish, show]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);

  useEffect(() => clearTick, [clearTick]);

  const runFrom = useCallback(
    (index: number, elapsedMs: number) => {
      startedAtRef.current = Date.now() - elapsedMs;
      indexRef.current = index;
      updateStatus('running');
      sync();
    },
    [sync, updateStatus]
  );

  const start = useCallback(() => {
    if (exercisesRef.current.length === 0) return;
    setRunId((n) => n + 1);
    runFrom(0, 0);
  }, [runFrom]);

  const pause = useCallback(() => {
    sync();
    if (statusRef.current !== 'running') return;
    clearTick();
    pausedMsRef.current = Date.now() - startedAtRef.current;
    updateStatus('paused');
  }, [clearTick, sync, updateStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    runFrom(indexRef.current, pausedMsRef.current);
  }, [runFrom]);

  const skip = useCallback(() => {
    sync();
    if (statusRef.current !== 'running' && statusRef.current !== 'paused') return;
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= exercisesRef.current.length) {
      finish();
      return;
    }
    setRunId((n) => n + 1);
    runFrom(nextIndex, 0);
  }, [finish, runFrom, sync]);

  // Restarts the current exercise, or goes to the previous one if the current one only just began.
  const goBack = useCallback(() => {
    sync();
    const current = statusRef.current;
    if (current !== 'running' && current !== 'paused') return;
    const elapsedMs = current === 'running' ? Date.now() - startedAtRef.current : pausedMsRef.current;
    const targetIndex = elapsedMs < 4000 && indexRef.current > 0 ? indexRef.current - 1 : indexRef.current;
    setRunId((n) => n + 1);
    if (current === 'running') {
      runFrom(targetIndex, 0);
    } else {
      pausedMsRef.current = 0;
      show(targetIndex, 0);
    }
  }, [runFrom, show, sync]);

  const reset = useCallback(() => {
    clearTick();
    pausedMsRef.current = 0;
    show(0, 0);
    updateStatus('idle');
  }, [clearTick, show, updateStatus]);

  // Derived from the exercise list on every render, so the first exercise shows before Start even
  // when the list loads after the screen mounts.
  const currentExercise = exercises[exerciseIndex] ?? null;
  const timeRemaining = Math.max(0, (currentExercise?.duration ?? 0) - elapsedSeconds);
  const currentSectionIndex = sections.findIndex((s) => s.id === currentExercise?.sectionId);

  return {
    status,
    exerciseIndex,
    timeRemaining,
    currentExercise,
    nextExercise: exercises[exerciseIndex + 1] ?? null,
    totalExercises: exercises.length,
    currentSectionIndex,
    currentSection: sections[currentSectionIndex] ?? null,
    sectionTimeRemaining: computeSectionTimeRemaining(exercises, exerciseIndex, timeRemaining),
    runId,
    controls: { start, pause, resume, skip, goBack, reset },
  };
}

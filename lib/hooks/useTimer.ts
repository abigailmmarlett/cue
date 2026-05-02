import { useState, useRef, useEffect, useCallback } from 'react';

export interface TimerExercise {
  id: string;
  name: string;
  duration: number;
  notes?: string | null;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  status: TimerStatus;
  exerciseIndex: number;
  timeRemaining: number;
  currentExercise: TimerExercise | null;
  nextExercise: TimerExercise | null;
  totalExercises: number;
}

export interface TimerControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  goBack: () => void;
  reset: () => void;
  end: () => void;
}

export function useTimer(exercises: TimerExercise[]): TimerState & { controls: TimerControls } {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exercises[0]?.duration ?? 0);

  // Refs to avoid stale closures and enable drift-free timing
  const anchorTimeRef = useRef<number>(0);
  const anchorSecondsRef = useRef<number>(0);
  const exerciseIndexRef = useRef<number>(0);
  const statusRef = useRef<TimerStatus>('idle');
  const timeRemainingRef = useRef<number>(exercises[0]?.duration ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync with state
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

  const setTime = useCallback((value: number) => {
    timeRemainingRef.current = value;
    setTimeRemaining(value);
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - anchorTimeRef.current) / 1000);
      const remaining = Math.max(0, anchorSecondsRef.current - elapsed);

      if (remaining > 0) {
        setTime(remaining);
        return;
      }

      const nextIndex = exerciseIndexRef.current + 1;
      if (nextIndex >= exercises.length) {
        clearTimer();
        setTime(0);
        statusRef.current = 'finished';
        setStatus('finished');
      } else {
        exerciseIndexRef.current = nextIndex;
        setExerciseIndex(nextIndex);
        const nextDuration = exercises[nextIndex].duration;
        anchorTimeRef.current = Date.now();
        anchorSecondsRef.current = nextDuration;
        setTime(nextDuration);
      }
    }, 200);
  }, [clearTimer, exercises, setTime]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const start = useCallback(() => {
    if (exercises.length === 0) return;
    exerciseIndexRef.current = 0;
    setExerciseIndex(0);
    anchorTimeRef.current = Date.now();
    anchorSecondsRef.current = exercises[0].duration;
    setTime(exercises[0].duration);
    statusRef.current = 'running';
    setStatus('running');
    startInterval();
  }, [exercises, setTime, startInterval]);

  const pause = useCallback(() => {
    clearTimer();
    statusRef.current = 'paused';
    setStatus('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    anchorTimeRef.current = Date.now();
    anchorSecondsRef.current = timeRemainingRef.current;
    statusRef.current = 'running';
    setStatus('running');
    startInterval();
  }, [startInterval]);

  const skip = useCallback(() => {
    const nextIndex = exerciseIndexRef.current + 1;
    if (nextIndex >= exercises.length) {
      clearTimer();
      setTime(0);
      statusRef.current = 'finished';
      setStatus('finished');
    } else {
      exerciseIndexRef.current = nextIndex;
      setExerciseIndex(nextIndex);
      const nextDuration = exercises[nextIndex].duration;
      anchorTimeRef.current = Date.now();
      anchorSecondsRef.current = nextDuration;
      setTime(nextDuration);
      if (statusRef.current !== 'running') {
        statusRef.current = 'running';
        setStatus('running');
        startInterval();
      }
    }
  }, [clearTimer, exercises, setTime, startInterval]);

  const goBack = useCallback(() => {
    const currentDuration = exercises[exerciseIndexRef.current]?.duration ?? 0;
    const elapsed = currentDuration - timeRemainingRef.current;
    const shouldGoPrev = elapsed <= 3 && exerciseIndexRef.current > 0;
    const targetIndex = shouldGoPrev ? exerciseIndexRef.current - 1 : exerciseIndexRef.current;

    exerciseIndexRef.current = targetIndex;
    setExerciseIndex(targetIndex);
    const duration = exercises[targetIndex].duration;
    anchorTimeRef.current = Date.now();
    anchorSecondsRef.current = duration;
    setTime(duration);

    if (statusRef.current === 'running') startInterval();
  }, [exercises, setTime, startInterval]);

  const reset = useCallback(() => {
    clearTimer();
    exerciseIndexRef.current = 0;
    setExerciseIndex(0);
    const firstDuration = exercises[0]?.duration ?? 0;
    setTime(firstDuration);
    statusRef.current = 'idle';
    setStatus('idle');
  }, [clearTimer, exercises, setTime]);

  const end = useCallback(() => {
    clearTimer();
    statusRef.current = 'finished';
    setStatus('finished');
  }, [clearTimer]);

  return {
    status,
    exerciseIndex,
    timeRemaining,
    currentExercise: exercises[exerciseIndex] ?? null,
    nextExercise: exercises[exerciseIndex + 1] ?? null,
    totalExercises: exercises.length,
    controls: { start, pause, resume, skip, goBack, reset, end },
  };
}

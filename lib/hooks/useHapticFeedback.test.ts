import { clock } from '../../test/setup-timers.ts';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react-test-renderer';
import { renderHook } from '../../test/renderHook.ts';
import { fired } from '../../test/stubs/expo-haptics.ts';
import { useTimer, type TimerExercise } from './useTimer.ts';
import { useHapticFeedback } from './useHapticFeedback.ts';
import { DEFAULT_HAPTIC_SETTINGS, type HapticSettings } from './usePreferences.ts';

// Countdown buzzes at 10, 5 and 3 seconds left, and a "heavy" buzz on each new exercise.
const settings: HapticSettings = {
  ...DEFAULT_HAPTIC_SETTINGS,
  countdownWarnings: [
    { seconds: 10, style: 'warning' },
    { seconds: 5, style: 'error' },
    { seconds: 3, style: 'success' },
  ],
  onExerciseTransition: { enabled: true, style: 'heavy' },
  onSectionTransition: { enabled: false, style: 'medium' },
  onCompletion: { enabled: false, style: 'success' },
  onMark: { enabled: false, style: 'light' },
};
const COUNTDOWN = 'warning,error,success';
const list: TimerExercise[] = [0, 1, 2].map((i) => ({
  id: `e${i}`,
  name: `E${i}`,
  duration: 30,
  sectionId: 's',
  tags: [],
  loadModified: null,
  loadBase: null,
  loadAmplified: null,
  variation: null,
  variationSets: null,
  side: null,
}));
const sections = [{ id: 's', name: 'S', duration: 90 }];

let hook: ReturnType<typeof renderHook<null, ReturnType<typeof useTimer>>>;
const timer = () => hook.result.current;
const tick = (ms: number) => act(() => void clock.tick(ms));
const press = (control: keyof ReturnType<typeof useTimer>['controls']) => act(() => timer().controls[control]());
/** The haptics played since the last call. */
const played = () => fired.splice(0).join(',') || '(none)';

beforeEach(() => {
  hook = renderHook(() => {
    const state = useTimer(list, sections);
    useHapticFeedback(state, settings);
    return state;
  }, null);
  fired.length = 0;
});
afterEach(() => {
  hook.unmount();
  clock.reset();
});

test('countdown buzzes play once; pausing and resuming doesn’t repeat them or the new-exercise buzz', () => {
  press('start');
  tick(28_100);
  assert.equal(played(), COUNTDOWN);
  press('pause');
  press('resume');
  tick(500);
  assert.equal(played(), '(none)');
  tick(2000);
  assert.equal(timer().exerciseIndex, 1);
  assert.equal(played(), 'heavy');
  press('pause');
  press('resume');
  tick(100);
  assert.equal(played(), '(none)');
});

test('Pause, then Back to restart the exercise, then Resume plays the countdown again', () => {
  press('start');
  tick(28_100);
  played();
  press('pause');
  press('goBack');
  press('resume');
  tick(28_100);
  assert.equal(played(), COUNTDOWN);
});

test('Back to the previous exercise, then Skip forward, buzzes and re-arms the countdown', () => {
  press('start');
  tick(30_010);
  played();
  tick(1000);
  press('pause');
  press('goBack');
  assert.equal(timer().exerciseIndex, 0);
  press('skip');
  assert.equal(timer().exerciseIndex, 1);
  assert.equal(played(), 'heavy');
  tick(28_100);
  assert.equal(played(), COUNTDOWN);
});

test('Back while running restarts the exercise and re-arms its countdown', () => {
  press('start');
  tick(28_100);
  played();
  press('goBack');
  assert.equal(timer().exerciseIndex, 0);
  tick(28_100);
  assert.equal(played(), COUNTDOWN);
});

test('restarting after finishing plays the countdown again from the first exercise', () => {
  press('start');
  tick(91_000);
  assert.equal(timer().status, 'finished');
  played();
  press('reset');
  press('start');
  tick(28_100);
  assert.equal(played(), COUNTDOWN);
});

test('the load-change buzz ignores an emptied load and the end of the workout, but not a real change', () => {
  hook.unmount();
  const loads: (string[] | null)[] = [null, [], ['band']];
  const withLoads = list.map((ex, i) => ({ ...ex, loadBase: loads[i] }));
  const loadSettings: HapticSettings = {
    ...settings,
    countdownWarnings: [],
    onExerciseTransition: { enabled: false, style: 'heavy' },
    onLoadChange: { enabled: true, timing: 'countdown', secondsBefore: 5, style: 'rigid' },
  };
  hook = renderHook(() => {
    const state = useTimer(withLoads, sections);
    useHapticFeedback(state, loadSettings);
    return state;
  }, null);
  fired.length = 0;

  // A second at a time, like the real timer, since these cross from one exercise to the next.
  const run = (seconds: number) => {
    for (let i = 0; i < seconds; i++) tick(1000);
  };
  press('start');
  run(26); // 4 s before the end of E0: E1's load is empty, which is no change
  assert.equal(played(), '(none)');
  run(30); // 4 s before the end of E1: E2 has a band
  assert.equal(played(), 'rigid');
  run(30); // 4 s before the end of E2, the last exercise
  assert.equal(played(), '(none)');
});

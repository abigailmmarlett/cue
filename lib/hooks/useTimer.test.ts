import { clock } from '../../test/setup-timers.ts';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react-test-renderer';
import { renderHook } from '../../test/renderHook.ts';
import { setAppState } from '../../test/stubs/react-native.ts';
import { useTimer, type TimerExercise, type TimerSection } from './useTimer.ts';

/** Exercises with these durations (seconds); the first two are in section A, the rest in B. */
const exercises = (durations: number[]): TimerExercise[] =>
  durations.map((duration, i) => ({
    id: `e${i}`,
    name: `E${i}`,
    duration,
    sectionId: i < 2 ? 'a' : 'b',
    tags: [],
    loadModified: null,
    loadBase: null,
    loadAmplified: null,
    variation: null,
    variationSets: null,
    side: null,
  }));
const sections: TimerSection[] = [
  { id: 'a', name: 'A', duration: 0 },
  { id: 'b', name: 'B', duration: 0 },
];

let hook: ReturnType<typeof renderHook<TimerExercise[], ReturnType<typeof useTimer>>> | null = null;
function mount(list: TimerExercise[]) {
  hook = renderHook((l: TimerExercise[]) => useTimer(l, sections), list);
  return hook;
}
const timer = () => hook!.result.current;
const tick = (ms: number) => act(() => void clock.tick(ms));
const press = (control: keyof ReturnType<typeof useTimer>['controls']) => act(() => timer().controls[control]());
/** status, exercise, seconds left in it and in its section. */
const state = () =>
  `${timer().status} #${timer().exerciseIndex} ${timer().timeRemaining}s section ${timer().sectionTimeRemaining}s`;

afterEach(() => {
  hook?.unmount();
  hook = null;
  clock.reset();
});

test('shows the first exercise before Start, even when the list loads after mounting', () => {
  const { rerender } = mount([]);
  assert.equal(timer().timeRemaining, 0);
  rerender(exercises([30, 20]));
  assert.equal(state(), 'idle #0 30s section 50s');
});

test('counts down on whole seconds', () => {
  mount(exercises([30, 20]));
  press('start');
  assert.equal(timer().timeRemaining, 30);
  tick(999);
  assert.equal(timer().timeRemaining, 30);
  tick(10);
  assert.equal(timer().timeRemaining, 29);
  tick(5000);
  assert.equal(timer().timeRemaining, 24);
});

test('moves to the next exercise without losing time', () => {
  mount(exercises([3, 5]));
  press('start');
  tick(3010);
  assert.equal(state(), 'running #1 5s section 5s');
  tick(2000);
  assert.equal(timer().timeRemaining, 3);
});

test('catches up after the phone was locked, when no timers ran', () => {
  mount(exercises([10, 10, 10]));
  press('start');
  tick(2000);
  clock.setSystemTime(Date.now() + 15_000);
  act(() => setAppState('active'));
  assert.equal(state(), 'running #1 3s section 3s', '17s in: all of the first exercise and 7s of the second');
  tick(3010);
  assert.equal(state(), 'running #2 10s section 10s');
});

test('finishes if the whole workout passed while locked', () => {
  mount(exercises([10, 10]));
  press('start');
  clock.setSystemTime(Date.now() + 60_000);
  act(() => setAppState('active'));
  assert.equal(timer().status, 'finished');
});

test('pause and resume keep the part of a second already done', () => {
  mount(exercises([30]));
  press('start');
  tick(2700);
  assert.equal(timer().timeRemaining, 28);
  press('pause');
  tick(10_000);
  assert.equal(state(), 'paused #0 28s section 28s');
  press('resume');
  tick(310);
  assert.equal(timer().timeRemaining, 27);
});

test('pausing right after unlocking pauses at the caught-up time', () => {
  mount(exercises([10, 10]));
  press('start');
  clock.setSystemTime(Date.now() + 12_500);
  press('pause');
  assert.equal(state(), 'paused #1 8s section 8s');
});

test('Back within 4 seconds goes to the previous exercise; later it restarts the current one', () => {
  mount(exercises([10, 10, 10]));
  press('start');
  tick(10_010);
  assert.equal(timer().exerciseIndex, 1);
  tick(2000);
  press('goBack');
  assert.equal(state(), 'running #0 10s section 20s');
  tick(6000);
  press('goBack');
  assert.equal(state(), 'running #0 10s section 20s');
});

test('Back while paused stays paused at the top of the exercise', () => {
  mount(exercises([10, 10]));
  press('start');
  tick(5000);
  press('pause');
  press('goBack');
  assert.equal(state(), 'paused #0 10s section 20s');
  tick(5000);
  assert.equal(timer().timeRemaining, 10);
});

test('Skip moves on (resuming if paused); skipping the last exercise finishes', () => {
  mount(exercises([10, 10]));
  press('start');
  press('pause');
  press('skip');
  assert.equal(state(), 'running #1 10s section 10s');
  press('skip');
  assert.equal(timer().status, 'finished');
});

test('Reset goes back to the first exercise, idle, and Start works again', () => {
  mount(exercises([10, 10]));
  press('start');
  tick(12_000);
  press('reset');
  assert.equal(state(), 'idle #0 10s section 20s');
  tick(5000);
  assert.equal(timer().timeRemaining, 10);
  press('start');
  tick(1010);
  assert.equal(timer().timeRemaining, 9);
});

test('controls do nothing before Start, and Start does nothing with no exercises', () => {
  mount(exercises([10]));
  press('skip');
  press('goBack');
  press('pause');
  assert.equal(state(), 'idle #0 10s section 10s');
  hook!.unmount();
  mount([]);
  press('start');
  assert.equal(timer().status, 'idle');
});

test('leaving the screen stops the timer', () => {
  const { unmount } = mount(exercises([10]));
  press('start');
  unmount();
  hook = null;
  assert.equal(clock.countTimers(), 0);
});

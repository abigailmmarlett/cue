import FakeTimers from '@sinonjs/fake-timers';

// Import this first in hook tests: fake clocks and timers, and tell React it's running under act().
export const clock = FakeTimers.install({
  now: 1_000_000,
  toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function totalDuration(exercises: { duration: number }[]): number {
  return exercises.reduce((sum, e) => sum + e.duration, 0);
}

/** Splits `total` seconds across `count` exercises, giving each at least 1 second. */
export function splitDuration(total: number, count: number): number[] {
  const safeTotal = Math.max(total, count);
  const each = Math.floor(safeTotal / count);
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? safeTotal - each * (count - 1) : each));
}

/**
 * Where the timer should be once `elapsedMs` has passed since exercise `index` started, moving on
 * through any exercises that have already run out. Returns null when the whole sequence is over.
 */
export function positionAfter(
  exercises: { duration: number }[],
  index: number,
  elapsedMs: number
): { index: number; elapsedMs: number } | null {
  let i = index;
  let ms = Math.max(0, elapsedMs);
  while (i < exercises.length && ms >= exercises[i].duration * 1000) {
    ms -= exercises[i].duration * 1000;
    i++;
  }
  return i < exercises.length ? { index: i, elapsedMs: ms } : null;
}

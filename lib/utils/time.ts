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

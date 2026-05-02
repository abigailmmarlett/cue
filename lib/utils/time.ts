export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function totalDuration(exercises: { duration: number }[]): number {
  return exercises.reduce((sum, e) => sum + e.duration, 0);
}

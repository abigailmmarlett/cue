// Run on the UI thread during drags, hence the worklet directives.

/** Each item's slot (0 at the top), by id. */
export type Slots = Record<string, number>;

export function slotsOf(ids: string[]): Slots {
  'worklet';
  const slots: Slots = {};
  ids.forEach((id, i) => (slots[id] = i));
  return slots;
}

/** The slot an item dragged `dy` points from slot `from` is over, kept within the list. */
export function hoverSlot(from: number, dy: number, itemHeight: number, count: number): number {
  'worklet';
  return Math.round(Math.max(0, Math.min(from + dy / itemHeight, count - 1)));
}

/** The slots once `id` moves to slot `to`, with the items in between closing up around it. */
export function slotsWithMove(ids: string[], id: string, to: number): Slots {
  'worklet';
  const next = ids.filter((other) => other !== id);
  next.splice(to, 0, id);
  return slotsOf(next);
}

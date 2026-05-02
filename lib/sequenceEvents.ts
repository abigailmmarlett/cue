type Listener = () => void;
const listeners = new Set<Listener>();

export function onSequenceChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSequenceChange(): void {
  listeners.forEach((fn) => fn());
}

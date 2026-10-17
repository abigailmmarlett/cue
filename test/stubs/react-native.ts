// The parts of react-native the hooks under test use.
type Listener = (state: string) => void;
const listeners = new Set<Listener>();

export const AppState = {
  addEventListener(_type: 'change', listener: Listener) {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

/** Simulates the app moving to the foreground ('active') or background. */
export function setAppState(state: string): void {
  listeners.forEach((listener) => listener(state));
}

import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

// react-test-renderer warns that it's deprecated unless told it's testing React Native code, which
// this is: the hooks under test run in React Native, with native modules stubbed out.
(globalThis as { IS_REACT_NATIVE_TEST_ENVIRONMENT?: boolean }).IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

/** Renders a hook in a bare component. `result.current` is its latest return value. */
export function renderHook<Props, Result>(hook: (props: Props) => Result, initialProps: Props) {
  const result = { current: undefined as Result };
  function Probe({ props }: { props: Props }) {
    result.current = hook(props);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(createElement(Probe, { props: initialProps }));
  });
  return {
    result,
    rerender: (props: Props) => act(() => renderer.update(createElement(Probe, { props }))),
    unmount: () => act(() => renderer.unmount()),
  };
}

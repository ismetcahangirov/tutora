import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const emptySubscribe = () => () => {};

/**
 * To support static rendering, the color scheme must be re-calculated on the client for web.
 * `useSyncExternalStore` yields the server snapshot (`false`) during SSR/hydration and the
 * client snapshot (`true`) afterwards — no `setState` inside an effect (avoids cascading renders).
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}

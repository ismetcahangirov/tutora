import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value (e.g. a search field) so downstream effects
 * — like query refetches — only fire once the value settles. This is a genuine
 * external-system sync (a timer), so `useEffect` with cleanup is the right tool.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

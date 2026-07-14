import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client. A single retry with a 30s stale window suits an
 * admin dashboard: data is read-heavy but must not feel stale. A 401 that
 * survives the axios refresh means the session is dead, so retrying is pointless.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

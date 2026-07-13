/**
 * The app's single TanStack Query client (student epic #40).
 *
 * Server state — tutor search, profiles, taxonomy, reviews — is owned by React
 * Query, never duplicated into a global store (see the State Management rules in
 * CLAUDE.md). Defaults are tuned for a mobile client: a short `staleTime` keeps
 * lists fresh without hammering the API, `retry: 1` avoids long spinners on a
 * flaky connection, and window-focus refetching is off because it has no meaning
 * on React Native.
 */
import { QueryClient } from '@tanstack/react-query';

/** One minute — long enough to make tab switches instant, short enough to stay fresh. */
export const DEFAULT_STALE_TIME = 60_000;

/** Build a fresh client. A factory (not a singleton) so tests get an isolated cache. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

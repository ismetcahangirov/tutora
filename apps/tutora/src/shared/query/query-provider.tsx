/**
 * QueryProvider — mounts the app-wide React Query client (student epic #40).
 *
 * Holds the client in lazy state so a single instance survives re-renders (and
 * Fast Refresh) without leaking across the app. Wired near the top of the root
 * layout so every feature's `useQuery`/`useMutation` has a client in context.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { createQueryClient } from './query-client';

export type QueryProviderProps = { children: ReactNode };

export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

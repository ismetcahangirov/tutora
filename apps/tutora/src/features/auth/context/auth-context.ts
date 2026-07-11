/**
 * auth-context — the React context object (issue #22).
 *
 * Split from the provider so consumers (the `useAuth` hook) and fast-refresh
 * stay clean. Default is `null`; `useAuth` throws if used outside the provider,
 * so consumers never deal with the `null` case.
 */
import { createContext } from 'react';

import type { AuthContextValue } from '../types';

export const AuthContext = createContext<AuthContextValue | null>(null);

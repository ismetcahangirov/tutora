/**
 * Comparison store — MMKV-backed, external-store shape (student epic #40, #46).
 *
 * The set of tutors a student has picked to compare is transient client state,
 * not server state, so it lives in a tiny synchronous store rather than React
 * Query. It follows the same `useSyncExternalStore` contract as favorites:
 * `subscribe` + a `getSnapshot` that returns a *stable* reference (the in-memory
 * `cache`) until the next write — re-creating the array on every read would loop
 * React forever. Writes update the cache, persist to MMKV, and notify.
 *
 * Selection is an **ordered array** (insertion order) so the compare columns
 * appear left-to-right in the order the student added them. Adding is capped at
 * `COMPARISON_LIMIT`.
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';

import { COMPARISON_LIMIT, COMPARISON_STORAGE_KEY } from '../constants';
import type { ComparisonEntry } from '../types';

const storage: MMKV = createMMKV({ id: 'tutora' });
const listeners = new Set<() => void>();

// Stable in-memory snapshot; hydrated lazily from MMKV, replaced only on write.
let cache: ComparisonEntry[] | null = null;

function read(): ComparisonEntry[] {
  if (cache === null) {
    const raw = storage.getString(COMPARISON_STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as ComparisonEntry[]) : [];
  }
  return cache;
}

function write(next: ComparisonEntry[]): void {
  cache = next;
  storage.set(COMPARISON_STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

/** Register a change listener; returns an unsubscribe. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current selection — a stable reference between writes. */
export function getComparisonSnapshot(): ComparisonEntry[] {
  return read();
}

export function isInComparison(id: string): boolean {
  return read().some((entry) => entry.id === id);
}

/** True when the selection is at capacity. */
export function isComparisonFull(): boolean {
  return read().length >= COMPARISON_LIMIT;
}

/**
 * Add a tutor to the comparison (appended last). Idempotent, and a no-op once the
 * limit is reached. Returns whether the tutor is in the selection afterwards, so
 * callers can surface a "limit reached" hint on a rejected add.
 */
export function addToComparison(entry: ComparisonEntry): boolean {
  const current = read();
  if (current.some((item) => item.id === entry.id)) {
    return true;
  }
  if (current.length >= COMPARISON_LIMIT) {
    return false;
  }
  write([...current, entry]);
  return true;
}

export function removeFromComparison(id: string): void {
  const current = read();
  if (!current.some((entry) => entry.id === id)) {
    return;
  }
  write(current.filter((entry) => entry.id !== id));
}

/**
 * Toggle a tutor's selection. Removing always succeeds; adding respects the
 * limit. Returns whether the tutor is selected afterwards.
 */
export function toggleComparison(entry: ComparisonEntry): boolean {
  if (isInComparison(entry.id)) {
    removeFromComparison(entry.id);
    return false;
  }
  return addToComparison(entry);
}

/** Clear the whole comparison selection. */
export function clearComparison(): void {
  write([]);
}

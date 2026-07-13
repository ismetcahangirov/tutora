/**
 * useComparison — reactive access to the comparison selection (epic #40, #46).
 *
 * Subscribes to the external comparison store via `useSyncExternalStore`, so a
 * card's compare toggle, the compare tray, and the comparison screen all stay in
 * sync the instant a tutor is added or removed anywhere. The returned actions are
 * the stable store functions; the derived flags close over the current snapshot.
 */
import { useMemo, useSyncExternalStore } from 'react';

import { COMPARISON_LIMIT, COMPARISON_MIN } from '../constants';
import {
  clearComparison,
  getComparisonSnapshot,
  removeFromComparison,
  subscribe,
  toggleComparison,
} from '../store/comparison-store';
import type { ComparisonEntry } from '../types';

export type UseComparison = {
  /** Selected tutors, in the order they were added. */
  entries: ComparisonEntry[];
  count: number;
  /** Max tutors that can be compared at once. */
  limit: number;
  /** True when at capacity — the selection UI blocks further adds. */
  isFull: boolean;
  /** True once enough tutors are selected to open a comparison. */
  canCompare: boolean;
  isSelected: (id: string) => boolean;
  /** Add/remove a tutor; returns whether it is selected afterwards. */
  toggle: (entry: ComparisonEntry) => boolean;
  remove: (id: string) => void;
  clear: () => void;
};

export function useComparison(): UseComparison {
  const entries = useSyncExternalStore(subscribe, getComparisonSnapshot, getComparisonSnapshot);

  const ids = useMemo(() => new Set(entries.map((entry) => entry.id)), [entries]);

  return {
    entries,
    count: entries.length,
    limit: COMPARISON_LIMIT,
    isFull: entries.length >= COMPARISON_LIMIT,
    canCompare: entries.length >= COMPARISON_MIN,
    isSelected: (id) => ids.has(id),
    toggle: toggleComparison,
    remove: removeFromComparison,
    clear: clearComparison,
  };
}

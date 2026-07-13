/**
 * comparison store (#46) — add/remove/toggle with the column limit, subscriber
 * notifications, and the stable-snapshot contract `useSyncExternalStore` relies
 * on. MMKV is stubbed by the global jest setup; `clearComparison` resets state
 * between tests.
 */
import { COMPARISON_LIMIT } from '@features/comparison/constants';
import type { ComparisonEntry } from '@features/comparison/types';
import {
  addToComparison,
  clearComparison,
  getComparisonSnapshot,
  isComparisonFull,
  isInComparison,
  removeFromComparison,
  subscribe,
  toggleComparison,
} from '../comparison-store';

const entry = (id: string): ComparisonEntry => ({ id, name: `Tutor ${id}`, avatarUrl: null });

beforeEach(() => clearComparison());

describe('comparison store (#46)', () => {
  it('adds a tutor and reports it as selected', () => {
    addToComparison(entry('t1'));
    expect(isInComparison('t1')).toBe(true);
    expect(getComparisonSnapshot()).toHaveLength(1);
  });

  it('preserves insertion order (left-to-right columns)', () => {
    addToComparison(entry('t1'));
    addToComparison(entry('t2'));
    expect(getComparisonSnapshot().map((item) => item.id)).toEqual(['t1', 't2']);
  });

  it('does not duplicate an already-selected tutor', () => {
    addToComparison(entry('t1'));
    addToComparison(entry('t1'));
    expect(getComparisonSnapshot()).toHaveLength(1);
  });

  it('caps the selection at the limit and reports a rejected add', () => {
    for (let i = 0; i < COMPARISON_LIMIT; i += 1) {
      expect(addToComparison(entry(`t${i}`))).toBe(true);
    }
    expect(isComparisonFull()).toBe(true);
    expect(addToComparison(entry('overflow'))).toBe(false);
    expect(getComparisonSnapshot()).toHaveLength(COMPARISON_LIMIT);
    expect(isInComparison('overflow')).toBe(false);
  });

  it('removes a selected tutor', () => {
    addToComparison(entry('t1'));
    removeFromComparison('t1');
    expect(isInComparison('t1')).toBe(false);
  });

  it('toggles a tutor on and off, returning the resulting state', () => {
    expect(toggleComparison(entry('t1'))).toBe(true);
    expect(isInComparison('t1')).toBe(true);
    expect(toggleComparison(entry('t1'))).toBe(false);
    expect(isInComparison('t1')).toBe(false);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);

    addToComparison(entry('t1'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    removeFromComparison('t1');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot reference between writes', () => {
    const before = getComparisonSnapshot();
    expect(getComparisonSnapshot()).toBe(before);

    addToComparison(entry('t1'));
    expect(getComparisonSnapshot()).not.toBe(before);
  });
});

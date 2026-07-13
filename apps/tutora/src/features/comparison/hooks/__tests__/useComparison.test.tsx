/**
 * useComparison (#46) — reactive access to the selection: toggling updates
 * `entries`, `count`, `isFull`, and `canCompare` across renders, and the limit
 * blocks a fourth add.
 */
import { act, renderHook } from '@testing-library/react-native';

import { clearComparison } from '@features/comparison/store/comparison-store';
import { COMPARISON_LIMIT } from '@features/comparison/constants';
import type { ComparisonEntry } from '@features/comparison/types';
import { useComparison } from '../useComparison';

const entry = (id: string): ComparisonEntry => ({ id, name: `Tutor ${id}`, avatarUrl: null });

beforeEach(() => clearComparison());

describe('useComparison (#46)', () => {
  it('starts empty and cannot compare yet', async () => {
    const { result } = await renderHook(() => useComparison());
    expect(result.current.count).toBe(0);
    expect(result.current.canCompare).toBe(false);
    expect(result.current.isSelected('t1')).toBe(false);
  });

  it('reflects a toggle immediately', async () => {
    const { result } = await renderHook(() => useComparison());

    await act(async () => void result.current.toggle(entry('t1')));
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected('t1')).toBe(true);
    expect(result.current.canCompare).toBe(false);

    await act(async () => void result.current.toggle(entry('t2')));
    expect(result.current.canCompare).toBe(true);
  });

  it('marks the selection full at the limit', async () => {
    const { result } = await renderHook(() => useComparison());

    for (let i = 0; i < COMPARISON_LIMIT; i += 1) {
      await act(async () => void result.current.toggle(entry(`t${i}`)));
    }
    expect(result.current.isFull).toBe(true);

    await act(async () => void result.current.toggle(entry('overflow')));
    expect(result.current.count).toBe(COMPARISON_LIMIT);
    expect(result.current.isSelected('overflow')).toBe(false);
  });

  it('clears the whole selection', async () => {
    const { result } = await renderHook(() => useComparison());

    await act(async () => void result.current.toggle(entry('t1')));
    await act(async () => result.current.clear());

    expect(result.current.count).toBe(0);
  });
});

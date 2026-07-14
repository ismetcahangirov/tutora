/**
 * Availability hooks (#55) — the read hook exposes the fetched slots; the write
 * hook replaces the week and writes the authoritative response into the cache.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { getAvailability, setAvailability } from '@features/availability/api/availability.api';
import { availabilityKeys } from '@features/availability/constants';
import type { AvailabilitySlot } from '@features/availability/types';

import { useAvailability } from '../useAvailability';
import { useSetAvailability } from '../useSetAvailability';

jest.mock('@features/availability/api/availability.api', () => ({
  getAvailability: jest.fn(),
  setAvailability: jest.fn(),
}));

const mockedGet = getAvailability as jest.MockedFunction<typeof getAvailability>;
const mockedSet = setAvailability as jest.MockedFunction<typeof setAvailability>;

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const SLOT: AvailabilitySlot = { id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 };

describe('useAvailability (#55)', () => {
  it('exposes the fetched slots', async () => {
    mockedGet.mockResolvedValueOnce([SLOT]);

    const { result } = await renderHook(() => useAvailability(), { wrapper: setup().wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.slots).toEqual([SLOT]);
  });

  it('defaults to an empty list before the fetch resolves', async () => {
    mockedGet.mockReturnValueOnce(new Promise<AvailabilitySlot[]>(() => {}));

    const { result } = await renderHook(() => useAvailability(), { wrapper: setup().wrapper });

    expect(result.current.slots).toEqual([]);
  });
});

describe('useSetAvailability (#55)', () => {
  it('saves the week and writes the response into the availability cache', async () => {
    mockedSet.mockResolvedValueOnce([SLOT]);
    const { client, wrapper } = setup();

    const { result } = await renderHook(() => useSetAvailability(), { wrapper });

    const saved = await result.current.save({
      slots: [{ weekday: 'MON', startMinute: 540, endMinute: 660 }],
    });

    expect(mockedSet).toHaveBeenCalledWith({
      slots: [{ weekday: 'MON', startMinute: 540, endMinute: 660 }],
    });
    expect(saved).toEqual([SLOT]);
    expect(client.getQueryData(availabilityKeys.list())).toEqual([SLOT]);
  });
});

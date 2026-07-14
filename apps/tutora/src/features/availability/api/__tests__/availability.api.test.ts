/**
 * availability API (#55) — endpoints + payloads for reading and replacing the
 * caller's weekly availability. The shared client is mocked so only the request
 * shape is asserted.
 */
import { apiClient } from '@/shared/lib';
import { AVAILABILITY_ENDPOINTS } from '@features/availability/constants';

import { getAvailability, setAvailability } from '../availability.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPut = apiClient.put as jest.Mock;

describe('getAvailability (#55)', () => {
  it('requests the availability endpoint and returns the slots', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }],
    });

    const slots = await getAvailability();

    expect(mockedGet).toHaveBeenCalledWith(AVAILABILITY_ENDPOINTS.availability);
    expect(slots).toEqual([{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }]);
  });
});

describe('setAvailability (#55)', () => {
  it('puts the full week and returns the saved slots', async () => {
    const input = { slots: [{ weekday: 'MON' as const, startMinute: 540, endMinute: 660 }] };
    mockedPut.mockResolvedValueOnce({
      data: [{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }],
    });

    const slots = await setAvailability(input);

    expect(mockedPut).toHaveBeenCalledWith(AVAILABILITY_ENDPOINTS.availability, input);
    expect(slots).toEqual([{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }]);
  });
});

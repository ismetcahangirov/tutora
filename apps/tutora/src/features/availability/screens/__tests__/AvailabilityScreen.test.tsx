/**
 * AvailabilityScreen (#55) — renders the loading / error states, the lesson-format
 * summary, the seven weekday rows, and the edit-and-save flow. Feature hooks, the
 * profile hook, and the toast are mocked.
 */
import { useToast } from '@/components/ui';
import { useMyTutorProfile } from '@features/tutor-profile';
import type { MyTutorProfile } from '@features/tutor-profile';
import {
  useAvailability,
  type UseAvailabilityResult,
} from '@features/availability/hooks/useAvailability';
import { useSetAvailability } from '@features/availability/hooks/useSetAvailability';
import type { AvailabilitySlot } from '@features/availability/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

import { AvailabilityScreen } from '../AvailabilityScreen';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/tutor-profile', () => ({ useMyTutorProfile: jest.fn() }));
jest.mock('@features/availability/hooks/useAvailability', () => ({ useAvailability: jest.fn() }));
jest.mock('@features/availability/hooks/useSetAvailability', () => ({
  useSetAvailability: jest.fn(),
}));

const mockedAvailability = useAvailability as jest.MockedFunction<typeof useAvailability>;
const mockedSetAvailability = useSetAvailability as jest.MockedFunction<typeof useSetAvailability>;
const mockedProfile = useMyTutorProfile as jest.MockedFunction<typeof useMyTutorProfile>;
const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;

const show = jest.fn();
const save = jest.fn();

const MON_SLOT: AvailabilitySlot = { id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 };

function availabilityResult(overrides: Partial<UseAvailabilityResult>): UseAvailabilityResult {
  return {
    slots: [],
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  show.mockClear();
  save.mockReset().mockResolvedValue([]);
  mockedUseToast.mockReturnValue({ show, hide: jest.fn() });
  mockedSetAvailability.mockReturnValue({ save, isSaving: false });
  mockedProfile.mockReturnValue({
    profile: { formats: ['ONLINE'] } as unknown as MyTutorProfile,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  });
});

describe('AvailabilityScreen (#55)', () => {
  it('shows a loading state while availability loads', async () => {
    mockedAvailability.mockReturnValue(availabilityResult({ isLoading: true }));

    await renderWithProviders(<AvailabilityScreen onBack={jest.fn()} />);

    expect(screen.getByText('Loading…')).toBeOnTheScreen();
  });

  it('shows an error state with retry when loading fails', async () => {
    const refetch = jest.fn();
    mockedAvailability.mockReturnValue(availabilityResult({ isError: true, refetch }));

    await renderWithProviders(<AvailabilityScreen onBack={jest.fn()} />);

    expect(screen.getByText('Couldn’t load your availability')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the format summary and a filled weekday with its ranges', async () => {
    mockedAvailability.mockReturnValue(availabilityResult({ slots: [MON_SLOT] }));

    await renderWithProviders(<AvailabilityScreen onBack={jest.fn()} />);

    expect(screen.getByText('Lesson formats')).toBeOnTheScreen();
    expect(screen.getByText('Online')).toBeOnTheScreen();
    expect(screen.getByText('Monday')).toBeOnTheScreen();
    expect(screen.getByText('09:00 – 11:00')).toBeOnTheScreen();
  });

  it('edits a day and saves the whole week', async () => {
    mockedAvailability.mockReturnValue(availabilityResult({ slots: [MON_SLOT] }));

    await renderWithProviders(<AvailabilityScreen onBack={jest.fn()} />);

    // Open the (empty) Wednesday editor, select 09:00–10:00, and save.
    await fireEvent.press(screen.getByText('Wednesday'));
    await fireEvent.press(screen.getByText('09:00'));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        slots: [
          { weekday: 'MON', startMinute: 540, endMinute: 660 },
          { weekday: 'WED', startMinute: 540, endMinute: 600 },
        ],
      }),
    );
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Availability updated.', type: 'success' }),
    );
  });
});

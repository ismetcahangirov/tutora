/**
 * Availability feature — public barrel (tutor epic #51, #55; backend #55).
 *
 * The tutor's weekly schedule: view, edit and save recurring availability windows.
 *   `import { AvailabilityScreen } from '@features/availability';`
 */
export { AvailabilityScreen, type AvailabilityScreenProps } from './screens/AvailabilityScreen';

export { useAvailability, type UseAvailabilityResult } from './hooks/useAvailability';
export { availabilityKeys } from './constants';

export type {
  Weekday,
  AvailabilitySlot,
  AvailabilitySlotInput,
  SetAvailabilityInput,
} from './types';

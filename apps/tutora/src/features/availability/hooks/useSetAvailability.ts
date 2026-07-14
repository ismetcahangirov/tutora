/**
 * useSetAvailability — replace the caller's whole weekly availability (#55).
 *
 * The endpoint returns the authoritative saved slots (with server ids), so on
 * success we write them straight into the query cache — no refetch needed.
 * `save` resolves with the saved slots (or rejects) so the screen can toast on
 * the outcome.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setAvailability } from '../api/availability.api';
import { availabilityKeys } from '../constants';
import type { AvailabilitySlot, SetAvailabilityInput } from '../types';

export type UseSetAvailabilityResult = {
  save: (input: SetAvailabilityInput) => Promise<AvailabilitySlot[]>;
  isSaving: boolean;
};

export function useSetAvailability(): UseSetAvailabilityResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: SetAvailabilityInput) => setAvailability(input),
    onSuccess: (slots) => {
      queryClient.setQueryData(availabilityKeys.list(), slots);
    },
  });

  return { save: mutation.mutateAsync, isSaving: mutation.isPending };
}

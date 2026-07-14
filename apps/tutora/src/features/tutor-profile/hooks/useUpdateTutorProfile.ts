/**
 * useUpdateTutorProfile — patch the editable profile fields (tutor epic #51, #53, #56).
 *
 * The endpoint returns the full refreshed profile, so on success we write it
 * straight into the `me` cache (`setQueryData`) — no refetch round-trip. `update`
 * resolves with the updated profile (or rejects) so the screen can toast on the
 * outcome and leave the form intact on failure.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateMyTutorProfile } from '../api/tutor-profile.api';
import { tutorProfileKeys } from '../constants';
import type { MyTutorProfile, UpdateTutorProfileInput } from '../types';

export type UseUpdateTutorProfileResult = {
  update: (input: UpdateTutorProfileInput) => Promise<MyTutorProfile>;
  isUpdating: boolean;
};

export function useUpdateTutorProfile(): UseUpdateTutorProfileResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: UpdateTutorProfileInput) => updateMyTutorProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(tutorProfileKeys.me(), profile);
    },
  });

  return { update: mutation.mutateAsync, isUpdating: mutation.isPending };
}

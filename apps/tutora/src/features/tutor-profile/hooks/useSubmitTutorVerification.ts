/**
 * useSubmitTutorVerification — send the profile for admin review (tutor epic #51, #54).
 *
 * A workflow action, distinct from ordinary field edits: it moves the profile to
 * `PENDING` and unlocks the publish toggle once an admin approves. The endpoint
 * returns the refreshed profile, written straight into the `me` cache on success.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { submitTutorVerification } from '../api/tutor-profile.api';
import { tutorProfileKeys } from '../constants';
import type { MyTutorProfile } from '../types';

export type UseSubmitTutorVerificationResult = {
  submit: () => Promise<MyTutorProfile>;
  isSubmitting: boolean;
};

export function useSubmitTutorVerification(): UseSubmitTutorVerificationResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: submitTutorVerification,
    onSuccess: (profile) => {
      queryClient.setQueryData(tutorProfileKeys.me(), profile);
    },
  });

  return { submit: mutation.mutateAsync, isSubmitting: mutation.isPending };
}

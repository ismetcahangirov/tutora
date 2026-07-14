import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reviewCertificate, setVerification } from '../api/tutors.api';
import { verificationsKeys } from '../constants';
import type { ReviewCertificateBody, SetVerificationBody } from '../types';

/** Verify / reject a tutor's identity. Invalidates the queue and the open detail. */
export function useSetVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SetVerificationBody }) =>
      setVerification(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationsKeys.all }),
  });
}

/**
 * Approve / reject a single certificate. `certificateId` stays a top-level
 * variable so a shared instance can derive per-row pending/error state.
 */
export function useReviewCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tutorId,
      certificateId,
      body,
    }: {
      tutorId: string;
      certificateId: string;
      body: ReviewCertificateBody;
    }) => reviewCertificate(tutorId, certificateId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationsKeys.all }),
  });
}

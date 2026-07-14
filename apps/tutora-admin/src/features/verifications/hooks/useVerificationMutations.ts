import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reviewCertificate, setVerification } from '../api/tutors.api';
import { verificationsKeys } from '../constants';
import type { CertificateDecision, VerificationStatus } from '../types';

/** Verify / reject a tutor's identity. Invalidates the queue and the open detail. */
export function useSetVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) =>
      setVerification(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationsKeys.all }),
  });
}

/** Approve / reject a single certificate. */
export function useReviewCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tutorId,
      certificateId,
      status,
    }: {
      tutorId: string;
      certificateId: string;
      status: CertificateDecision;
    }) => reviewCertificate(tutorId, certificateId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationsKeys.all }),
  });
}

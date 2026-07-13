/**
 * useSubmitReview — author a review for a completed application (#48).
 *
 * On success every review query is invalidated so the caller's list and the
 * tutor's public reviews both catch up. `submit` resolves with the created review
 * (or rejects) so the screen can toast and navigate on the outcome.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { submitReview } from '../api/reviews.api';
import { reviewKeys } from '../constants';
import type { MyReview, SubmitReviewInput } from '../types';

export type UseSubmitReviewResult = {
  submit: (input: SubmitReviewInput) => Promise<MyReview>;
  isSubmitting: boolean;
};

export function useSubmitReview(): UseSubmitReviewResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: SubmitReviewInput) => submitReview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });

  return { submit: mutation.mutateAsync, isSubmitting: mutation.isPending };
}

/**
 * useUpdateReview — edit one of the caller's own reviews (#48).
 *
 * A rating change recomputes the tutor's average server-side, so on success every
 * review query is invalidated. `update` resolves with the updated review.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateReview } from '../api/reviews.api';
import { reviewKeys } from '../constants';
import type { MyReview, UpdateReviewInput } from '../types';

export type UseUpdateReviewResult = {
  update: (id: string, input: UpdateReviewInput) => Promise<MyReview>;
  isUpdating: boolean;
};

export function useUpdateReview(): UseUpdateReviewResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReviewInput }) =>
      updateReview(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });

  return {
    update: (id, input) => mutation.mutateAsync({ id, input }),
    isUpdating: mutation.isPending,
  };
}

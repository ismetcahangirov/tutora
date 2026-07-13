/**
 * useDeleteReview — remove one of the caller's own reviews (#48).
 *
 * The backend soft-deletes and recomputes the tutor's average, so on success every
 * review query is invalidated. `remove` resolves once the review is gone.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteReview } from '../api/reviews.api';
import { reviewKeys } from '../constants';

export type UseDeleteReviewResult = {
  remove: (id: string) => Promise<void>;
  isDeleting: boolean;
};

export function useDeleteReview(): UseDeleteReviewResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });

  return { remove: mutation.mutateAsync, isDeleting: mutation.isPending };
}

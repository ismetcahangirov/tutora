import { useMutation, useQueryClient } from '@tanstack/react-query';

import { moderateReview } from '../api/reviews.api';
import { reviewsKeys } from '../constants';
import type { ModerateReviewBody } from '../types';

/** Apply a moderation decision. Invalidates the list so the row reflects it. */
export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ModerateReviewBody }) =>
      moderateReview(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewsKeys.all }),
  });
}

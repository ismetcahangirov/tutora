/**
 * `/reviews/compose` — author or edit a review (issues #40, #48).
 *
 * A single composer route for both flows, selected by the `mode` param:
 *  - create: `?mode=create&applicationId=…&tutorName=…` (from a completed session).
 *  - edit:   `?mode=edit&reviewId=…&rating=…&comment=…` (from the My reviews list).
 * Params arrive as strings, so the rating is parsed back to a number.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ReviewComposerScreen, type ReviewComposerMode } from '@features/reviews';

export default function ReviewComposeRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    applicationId?: string;
    reviewId?: string;
    rating?: string;
    comment?: string;
    tutorName?: string;
  }>();

  const mode: ReviewComposerMode = params.mode === 'edit' ? 'edit' : 'create';
  const parsedRating = params.rating ? Number(params.rating) : undefined;

  const handleDone = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/reviews');
    }
  };

  return (
    <ReviewComposerScreen
      mode={mode}
      applicationId={params.applicationId}
      reviewId={params.reviewId}
      initialRating={Number.isFinite(parsedRating) ? parsedRating : undefined}
      initialComment={params.comment}
      tutorName={params.tutorName ?? null}
      onDone={handleDone}
    />
  );
}

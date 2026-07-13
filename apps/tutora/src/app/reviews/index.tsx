/**
 * `/reviews` — the caller's own reviews (issues #40, #48).
 *
 * Lives at the root stack (not inside the `(student)` tabs) so it pushes
 * full-screen over the tab bar, mirroring `/tutor/[id]` and `/chat/[id]`. Reached
 * from the Profile tab. Editing a review pushes the composer pre-filled with it.
 */
import { useRouter } from 'expo-router';

import { MyReviewsScreen } from '@features/reviews';

export default function MyReviewsRoute() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <MyReviewsScreen
      onBack={goBack}
      onEditReview={(review) =>
        router.push({
          pathname: '/reviews/compose',
          params: {
            mode: 'edit',
            reviewId: review.id,
            rating: String(review.rating),
            comment: review.comment ?? '',
          },
        })
      }
    />
  );
}

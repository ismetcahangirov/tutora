/**
 * Reviews feature — public barrel (student epic #40, #44, #48).
 *
 * Read (profile): list + preview a tutor's published reviews.
 * Write (#48): author, edit and delete the caller's own reviews.
 *   `import { MyReviewsScreen, ReviewComposerScreen } from '@features/reviews';`
 */

// Read side
export { useTutorReviews, type UseTutorReviewsResult } from './hooks/useTutorReviews';
export { ReviewsPreview, type ReviewsPreviewProps } from './components/ReviewsPreview';
export { ReviewCard, type ReviewCardProps } from './components/ReviewCard';
export { StarRating, type StarRatingProps } from './components/StarRating';
export { getTutorReviews } from './api/reviews.api';

// Write side (#48)
export { MyReviewsScreen, type MyReviewsScreenProps } from './screens/MyReviewsScreen';
export {
  ReviewComposerScreen,
  type ReviewComposerScreenProps,
  type ReviewComposerMode,
} from './screens/ReviewComposerScreen';

export type {
  Review,
  ReviewAuthor,
  ReviewStatus,
  MyReview,
  SubmitReviewInput,
  UpdateReviewInput,
} from './types';

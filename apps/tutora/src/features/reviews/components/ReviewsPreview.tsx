/**
 * ReviewsPreview — the reviews block on a tutor profile (student epic #40, #44).
 *
 * Fetches the first page of a tutor's reviews and renders them, with its own
 * loading (skeleton lines), empty ("no reviews yet"), and error treatments so the
 * profile screen stays declarative. The full list + write flow is story #48.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SkeletonText, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { useTutorReviews } from '../hooks/useTutorReviews';
import { ReviewCard } from './ReviewCard';

export type ReviewsPreviewProps = {
  tutorId: string;
};

export function ReviewsPreview({ tutorId }: ReviewsPreviewProps) {
  const { t } = useTranslation();
  const { reviews, isLoading, isError } = useTutorReviews(tutorId);

  if (isLoading) {
    return (
      <View style={styles.skeleton}>
        <SkeletonText lines={3} />
      </View>
    );
  }

  if (isError) {
    return (
      <Text variant="bodySmall" color="textSecondary">
        {t('reviews.error')}
      </Text>
    );
  }

  if (reviews.length === 0) {
    return (
      <Text variant="bodySmall" color="textSecondary">
        {t('reviews.empty')}
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  skeleton: {
    paddingVertical: spacing.sm,
  },
});

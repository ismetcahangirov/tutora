/**
 * ReviewCard — a single published review (student epic #40, #44).
 *
 * Author avatar + name, star rating, date, and comment. An author with no name
 * shows a localized "Anonymous" label. Presentational — data comes from the
 * reviews query.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, Text } from '@/components/ui';
import { formatShortDate } from '@/shared';
import { spacing } from '@/theme';

import type { Review } from '../types';
import { StarRating } from './StarRating';

export type ReviewCardProps = {
  review: Review;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const { t } = useTranslation();
  const authorName = review.author.name ?? t('reviews.anonymous');

  return (
    <Card padding="lg" elevated={false}>
      <View style={styles.header}>
        <Avatar uri={review.author.avatarUrl} name={review.author.name} size={40} />
        <View style={styles.headerText}>
          <Text variant="label" numberOfLines={1}>
            {authorName}
          </Text>
          <Text variant="caption" color="muted">
            {formatShortDate(review.createdAt)}
          </Text>
        </View>
        <StarRating rating={review.rating} />
      </View>

      {review.comment ? (
        <Text variant="bodySmall" color="textSecondary" style={styles.comment}>
          {review.comment}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  comment: {
    marginTop: spacing.md,
  },
});

/**
 * MyReviewCard — one of the caller's own reviews with edit + delete actions (#48).
 *
 * Shows the rating, its moderation status, the date and comment, then an actions
 * row. Edit is a neutral action; delete is destructive (danger). Presentational —
 * the screen owns navigation and the delete confirmation.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Icon, Text, type IconName } from '@/components/ui';
import { formatShortDate } from '@/shared';
import { radius, spacing, useColors, type ColorTokens } from '@/theme';

import type { MyReview } from '../types';
import { ReviewStatusBadge } from './ReviewStatusBadge';
import { StarRating } from './StarRating';

export type MyReviewCardProps = {
  review: MyReview;
  onEdit: () => void;
  onDelete: () => void;
};

export function MyReviewCard({ review, onEdit, onDelete }: MyReviewCardProps) {
  const { t } = useTranslation();

  return (
    <Card padding="lg" elevated={false}>
      <View style={styles.header}>
        <StarRating rating={review.rating} size={16} />
        <ReviewStatusBadge status={review.status} />
      </View>

      <Text variant="caption" color="muted" style={styles.date}>
        {formatShortDate(review.createdAt)}
      </Text>

      {review.comment ? (
        <Text variant="bodySmall" color="textSecondary" style={styles.comment}>
          {review.comment}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Action icon="edit" label={t('common.edit')} color="primary" onPress={onEdit} />
        <Action icon="trash" label={t('common.delete')} color="danger" onPress={onDelete} />
      </View>
    </Card>
  );
}

/** A compact icon + label action; padded to a comfortable tap target. */
function Action({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: keyof ColorTokens;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surface }]}
    >
      <Icon name={icon} size={16} color={color} />
      <Text variant="label" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    marginTop: spacing.xs,
  },
  comment: {
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
});

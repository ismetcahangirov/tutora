/**
 * ReviewStatusBadge — a small pill telling the author a review's moderation state (#48).
 *
 * PUBLISHED reads as success, HIDDEN as a warning (moderated off the profile), and
 * REMOVED as danger. An outlined pill keeps it legible in both themes without a
 * tinted fill.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { radius, spacing, useColors, type ColorTokens } from '@/theme';

import type { ReviewStatus } from '../types';

export type ReviewStatusBadgeProps = {
  status: ReviewStatus;
};

const STATUS_COLOR: Record<ReviewStatus, keyof ColorTokens> = {
  PUBLISHED: 'success',
  HIDDEN: 'warning',
  REMOVED: 'danger',
};

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const token = STATUS_COLOR[status];

  return (
    <View style={[styles.pill, { borderColor: colors[token] }]}>
      <Text variant="caption" color={token}>
        {t(`reviews.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});

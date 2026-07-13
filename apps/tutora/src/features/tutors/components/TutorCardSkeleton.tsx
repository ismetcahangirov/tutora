/**
 * TutorCardSkeleton — loading placeholder matching TutorCard's layout (epic #40).
 *
 * Mirrors the card's avatar + text block so the list does not shift when real
 * data arrives. Hidden from screen readers; the screen announces loading.
 */
import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { radius, spacing } from '@/theme';

export function TutorCardSkeleton() {
  return (
    <Card elevated={false}>
      <View style={styles.row}>
        <Skeleton width={56} height={56} radius="full" />
        <View style={styles.body}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="35%" height={12} />
          <Skeleton width="80%" height={12} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
    </Card>
  );
}

/** A vertical stack of skeleton cards for an initial list load. */
export function TutorCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <TutorCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
});

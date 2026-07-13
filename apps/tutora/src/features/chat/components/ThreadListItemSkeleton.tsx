/**
 * ThreadListItemSkeleton — placeholder row while the thread list loads (#47).
 *
 * Mirrors the real `ThreadListItem` layout (avatar + two text lines) so the list
 * doesn't jump when data arrives. Hidden from screen readers; the screen
 * announces loading.
 */
import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

export function ThreadListItemSkeleton() {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width={52} height={52} radius="full" />
        <View style={styles.body}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="80%" height={12} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
});

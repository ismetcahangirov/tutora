/**
 * ProfileSection — a titled block on the tutor profile (student epic #40, #44).
 *
 * Gives every profile section (about, subjects, districts, certificates,
 * reviews…) a consistent title + spacing. An optional `count` renders next to the
 * title (e.g. "Reviews 24"). Callers decide whether a section appears at all —
 * empty ones (no subjects, no certificates) are simply not rendered upstream.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

export type ProfileSectionProps = {
  title: string;
  count?: number;
  children: ReactNode;
};

export function ProfileSection({ title, count, children }: ProfileSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text variant="subtitle">{title}</Text>
        {count !== undefined ? (
          <Text variant="subtitle" color="muted">
            {count}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** A horizontal, wrapping row of tags/chips for a section's content. */
export function TagRow({ children }: { children: ReactNode }) {
  return <View style={styles.tags}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

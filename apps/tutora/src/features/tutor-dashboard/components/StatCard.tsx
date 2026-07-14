/**
 * StatCard — a single headline metric on the tutor dashboard (tutor epic #51, #52).
 *
 * An icon, a large value, and a caption label in a soft card. Optionally tappable
 * (e.g. the pending-applications tile jumps to the inbox). Sizes to fill its grid
 * column, so a row of them lays out evenly.
 */
import { StyleSheet, View } from 'react-native';

import { Card, Icon, type IconName, Text } from '@/components/ui';
import { spacing } from '@/theme';

export type StatCardProps = {
  icon: IconName;
  value: string;
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function StatCard({ icon, value, label, onPress, accessibilityLabel }: StatCardProps) {
  return (
    <Card
      padding="lg"
      onPress={onPress}
      style={styles.card}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? `${value} ${label}`}
    >
      <Icon name={icon} size={22} color="primary" />
      <View style={styles.text}>
        <Text variant="title">{value}</Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.md,
    minHeight: 112,
  },
  text: {
    gap: spacing.xs,
  },
});

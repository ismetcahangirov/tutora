/**
 * NotificationsBadge — a compact unread-count pill (#50).
 *
 * Pure and presentational: renders nothing when the count is zero, and caps at
 * `max` (`99+`) so a large count never blows out its container. Reused wherever an
 * unread indicator is needed (a settings row, a future header bell).
 */
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useColors } from '@/theme';

import { UNREAD_BADGE_MAX } from '../constants';

export type NotificationsBadgeProps = {
  count: number;
  /** Cap after which the label becomes `${max}+`. Defaults to 99. */
  max?: number;
  accessibilityLabel?: string;
};

export function NotificationsBadge({
  count,
  max = UNREAD_BADGE_MAX,
  accessibilityLabel,
}: NotificationsBadgeProps) {
  const colors = useColors();

  if (count <= 0) {
    return null;
  }

  const label = count > max ? `${max}+` : String(count);

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.danger }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'text' : undefined}
    >
      <Text variant="caption" color="onPrimary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

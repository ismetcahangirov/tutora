/**
 * SettingRow — one row inside a settings group (student epic #40, #49).
 *
 * A leading icon + label (with an optional description), and a trailing slot for
 * a control (segmented control, language pills, a delete button). When `onPress`
 * is given the whole row is a button; if it also has no trailing control it shows
 * a chevron to signal navigation. Presentational and fully controlled.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { spacing, useColors } from '@/theme';

export type SettingRowProps = {
  icon?: IconName;
  label: string;
  description?: string;
  /** Right-aligned control (e.g. a switch or pills). Wins taps over `onPress`. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function SettingRow({
  icon,
  label,
  description,
  trailing,
  onPress,
  accessibilityLabel,
  testID,
}: SettingRowProps) {
  const colors = useColors();

  const content = (
    <>
      {icon ? <Icon name={icon} size={20} color="textSecondary" /> : null}
      <View style={styles.labels}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text variant="caption" color="textSecondary">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevron-right" size={20} color="muted" /> : null)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        testID={testID}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.row} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.xs,
  },
  labels: {
    flex: 1,
    gap: 2,
  },
});

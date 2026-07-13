/**
 * InfoTag — a static, read-only pill (student epic #40, #44).
 *
 * Non-interactive counterpart to `FilterChip`, used to display a tutor's
 * subjects, districts, languages, and formats on the profile. Optional leading
 * icon; a trailing note (e.g. a subject's price override) renders muted.
 */
import { StyleSheet, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

export type InfoTagProps = {
  label: string;
  icon?: IconName;
  note?: string;
};

export function InfoTag({ label, icon, note }: InfoTagProps) {
  const colors = useColors();

  return (
    <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon ? <Icon name={icon} size={14} color="textSecondary" /> : null}
      <Text variant="label" color="textPrimary">
        {label}
      </Text>
      {note ? (
        <Text variant="caption" color="primary">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});

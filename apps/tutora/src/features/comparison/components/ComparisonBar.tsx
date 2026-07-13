/**
 * ComparisonBar — the compare tray (student epic #40, #46).
 *
 * A sticky action bar the selection surface (Favorites) pins above the tab bar
 * whenever at least one tutor is picked to compare. It shows how many are
 * selected, nudges the student to add a second when only one is chosen, and — once
 * the minimum is met — opens the side-by-side comparison. Controlled: it owns no
 * store; `onCompare`/`onClear` and the counts are injected, so it is trivial to
 * render and test in isolation.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components/ui';
import { radius, shadows, spacing, useColors } from '@/theme';

export type ComparisonBarProps = {
  count: number;
  limit: number;
  /** True once enough tutors are selected to open a comparison. */
  canCompare: boolean;
  onCompare: () => void;
  onClear: () => void;
};

export function ComparisonBar({
  count,
  limit,
  canCompare,
  onCompare,
  onClear,
}: ComparisonBarProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View
      style={[styles.bar, shadows.md, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="toolbar"
    >
      <View style={styles.info}>
        <Text variant="label">{t('comparison.bar.selected', { count, limit })}</Text>
        {!canCompare ? (
          <Text variant="caption" color="textSecondary">
            {t('comparison.bar.hint')}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label={t('comparison.bar.clear')}
          variant="ghost"
          size="compact"
          onPress={onClear}
        />
        <Button
          label={t('comparison.bar.compare')}
          size="compact"
          disabled={!canCompare}
          onPress={onCompare}
          testID="comparison-bar-compare"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  info: {
    flexShrink: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

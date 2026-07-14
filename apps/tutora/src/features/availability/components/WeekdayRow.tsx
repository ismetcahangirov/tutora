/**
 * WeekdayRow — one day of the weekly availability grid (#55).
 *
 * A tappable card showing the weekday and its saved windows (or an "unavailable"
 * hint). Tapping opens the day editor. Presentational: all state and persistence
 * live in the screen.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Icon, Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { AvailabilitySlot } from '../types';
import { formatSlotRange } from '../utils/schedule';

export type WeekdayRowProps = {
  weekday: AvailabilitySlot['weekday'];
  slots: AvailabilitySlot[];
  onPress: () => void;
};

export function WeekdayRow({ weekday, slots, onPress }: WeekdayRowProps) {
  const { t } = useTranslation();

  const label = t(`tutor.availability.weekday.${weekday}`);
  const hasSlots = slots.length > 0;
  const summary = hasSlots
    ? slots.map(formatSlotRange).join(', ')
    : t('tutor.availability.unavailable');

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={
        hasSlots
          ? t('tutor.availability.rowA11y', { day: label, ranges: summary })
          : t('tutor.availability.rowEmptyA11y', { day: label })
      }
      accessibilityHint={t('tutor.availability.editHint')}
    >
      <View style={styles.row}>
        <View style={styles.text}>
          <Text variant="subtitle">{label}</Text>
          <Text variant="bodySmall" color={hasSlots ? 'textSecondary' : 'muted'}>
            {summary}
          </Text>
        </View>
        <Icon name="edit" color="textSecondary" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
});

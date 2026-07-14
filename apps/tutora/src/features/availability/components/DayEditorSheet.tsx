/**
 * DayEditorSheet — pick a weekday's availability as hourly blocks (#55).
 *
 * Mounted only while a day is being edited, so its selection seeds once from that
 * day's saved windows (no effect needed). Toggling the hour chips builds a preview
 * of the merged windows; Save hands the merged windows back to the screen, which
 * composes and persists the full week.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, FilterChip, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { DAY_END_MINUTE, DAY_START_MINUTE, SLOT_STEP_MINUTES } from '../constants';
import type { AvailabilitySlot, Weekday } from '../types';
import {
  buildDayBlocks,
  formatMinutes,
  formatSlotRange,
  mergeStartsToSlots,
  slotsToSelectedStarts,
} from '../utils/schedule';

type MinuteRange = { startMinute: number; endMinute: number };

export type DayEditorSheetProps = {
  weekday: Weekday;
  daySlots: AvailabilitySlot[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (slots: MinuteRange[]) => void;
};

export function DayEditorSheet({
  weekday,
  daySlots,
  isSaving,
  onClose,
  onSave,
}: DayEditorSheetProps) {
  const { t } = useTranslation();

  const blocks = useMemo(
    () => buildDayBlocks(DAY_START_MINUTE, DAY_END_MINUTE, SLOT_STEP_MINUTES),
    [],
  );
  const [selected, setSelected] = useState<number[]>(() =>
    slotsToSelectedStarts(daySlots, blocks, SLOT_STEP_MINUTES),
  );

  const preview = useMemo(() => mergeStartsToSlots(selected, SLOT_STEP_MINUTES), [selected]);

  const toggle = (block: number) => {
    setSelected((prev) =>
      prev.includes(block) ? prev.filter((value) => value !== block) : [...prev, block],
    );
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={t('tutor.availability.editor.title', {
        day: t(`tutor.availability.weekday.${weekday}`),
      })}
    >
      <Text variant="bodySmall" color="textSecondary">
        {t('tutor.availability.editor.hint')}
      </Text>

      <View style={styles.blocks}>
        {blocks.map((block) => (
          <FilterChip
            key={block}
            label={formatMinutes(block)}
            selected={selected.includes(block)}
            onPress={() => toggle(block)}
          />
        ))}
      </View>

      <Text variant="label" color={preview.length > 0 ? 'textPrimary' : 'muted'}>
        {preview.length > 0
          ? preview.map(formatSlotRange).join(', ')
          : t('tutor.availability.unavailable')}
      </Text>

      <View style={styles.actions}>
        <Button
          label={t('tutor.availability.editor.clear')}
          variant="outline"
          onPress={() => setSelected([])}
          disabled={isSaving || selected.length === 0}
          style={styles.actionButton}
        />
        <Button
          label={t('common.save')}
          variant="primary"
          onPress={() => onSave(preview)}
          loading={isSaving}
          style={styles.actionButton}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  blocks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

/**
 * ApplicationFilterBar — status filter chips for the applications inbox
 * (tutor epic #51, #57).
 *
 * A horizontal, scrollable row of `FilterChip`s over the offered filters (all +
 * the triage-relevant statuses). `undefined` is the "all" chip; selecting a chip
 * re-keys the list query. Single-select — exactly one is always active.
 */
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FilterChip } from '@/components/ui';
import { spacing } from '@/theme';

import { APPLICATION_FILTERS } from '../constants';
import type { ApplicationStatus } from '../types';

export type ApplicationFilterBarProps = {
  value: ApplicationStatus | undefined;
  onChange: (status: ApplicationStatus | undefined) => void;
};

export function ApplicationFilterBar({ value, onChange }: ApplicationFilterBarProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {APPLICATION_FILTERS.map((status) => (
        <FilterChip
          key={status ?? 'ALL'}
          label={
            status ? t(`tutor.applications.status.${status}`) : t('tutor.applications.filters.all')
          }
          selected={value === status}
          onPress={() => onChange(status)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

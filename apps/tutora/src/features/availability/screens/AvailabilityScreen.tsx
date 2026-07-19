/**
 * AvailabilityScreen — the tutor's weekly schedule (tutor epic #51, #55).
 *
 * One scrollable surface: a read-only summary of the lesson formats the tutor
 * offers (edited on the profile — the single source of truth) sits above the seven
 * weekday rows. Tapping a day opens the editor to set that day's hourly windows;
 * saving replaces the whole week in one request. Every data state — loading, error
 * with retry, loaded — is handled. Reached from the Profile tab and pushed
 * full-screen over the tab bar, mirroring `/subscription`.
 */
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorState, FilterChip, LoadingState, Text, useToast } from '@/components/ui';
import { useMyTutorProfile } from '@features/tutor-profile';
import { useRefreshControl } from '@/shared';
import { spacing, useColors } from '@/theme';

import { DayEditorSheet } from '../components/DayEditorSheet';
import { WeekdayRow } from '../components/WeekdayRow';
import { WEEKDAYS } from '../constants';
import { useAvailability } from '../hooks/useAvailability';
import { useSetAvailability } from '../hooks/useSetAvailability';
import type { Weekday } from '../types';
import { groupSlotsByWeekday, replaceDaySlots } from '../utils/schedule';

type MinuteRange = { startMinute: number; endMinute: number };

export type AvailabilityScreenProps = {
  onBack: () => void;
};

export function AvailabilityScreen({ onBack }: AvailabilityScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();

  const { slots, isLoading, isError, isRefetching, refetch } = useAvailability();
  const { save, isSaving } = useSetAvailability();
  const { profile } = useMyTutorProfile();
  const refreshControl = useRefreshControl(isRefetching, refetch);

  const [editingWeekday, setEditingWeekday] = useState<Weekday | null>(null);

  const grouped = useMemo(() => groupSlotsByWeekday(slots), [slots]);

  const handleSaveDay = async (daySlots: MinuteRange[]) => {
    if (editingWeekday === null) {
      return;
    }
    try {
      await save({ slots: replaceDaySlots(slots, editingWeekday, daySlots) });
      toast.show({ message: t('tutor.availability.saved'), type: 'success' });
      setEditingWeekday(null);
    } catch {
      toast.show({ message: t('tutor.availability.error'), type: 'error' });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Button
          label={t('common.back')}
          accessibilityLabel={t('common.back')}
          variant="ghost"
          size="compact"
          leadingIcon="arrow-left"
          onPress={onBack}
        />
        <Text variant="subtitle" numberOfLines={1} style={styles.headerTitle}>
          {t('tutor.availability.title')}
        </Text>
      </View>

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <ErrorState
          title={t('tutor.availability.errorTitle')}
          description={t('tutor.availability.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          <Text variant="body" color="textSecondary">
            {t('tutor.availability.subtitle')}
          </Text>

          {profile && profile.formats.length > 0 ? (
            <View style={styles.section}>
              <Text variant="subtitle">{t('tutor.availability.formats.title')}</Text>
              <View style={styles.chips}>
                {profile.formats.map((format) => (
                  <FilterChip
                    key={format}
                    label={t(`tutors.format.${format}`, { defaultValue: format })}
                    selected
                  />
                ))}
              </View>
              <Text variant="caption" color="muted">
                {t('tutor.availability.formats.hint')}
              </Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="subtitle">{t('tutor.availability.weekTitle')}</Text>
            {WEEKDAYS.map((day) => (
              <WeekdayRow
                key={day}
                weekday={day}
                slots={grouped[day]}
                onPress={() => setEditingWeekday(day)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {editingWeekday !== null ? (
        <DayEditorSheet
          weekday={editingWeekday}
          daySlots={grouped[editingWeekday]}
          isSaving={isSaving}
          onClose={() => setEditingWeekday(null)}
          onSave={(daySlots) => void handleSaveDay(daySlots)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
    gap: spacing['2xl'],
  },
  section: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

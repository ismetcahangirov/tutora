/**
 * ComparisonScreen — side-by-side tutor comparison (student epic #40, #46).
 *
 * Renders one horizontally-scrollable column per tutor the student picked to
 * compare (from the comparison store). Each column fetches its own profile, so
 * the screen has no single loading/error state — columns resolve independently.
 * Lives in the `tutors` feature (like `FavoritesScreen`) because it composes the
 * comparison selection with tutor profile data; it pushes over the tab bar as a
 * full-screen route. Handles the empty case explicitly: clearing the last tutor
 * leaves a guiding empty state rather than a blank scroller.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useComparison } from '@features/comparison';
import { Button, EmptyState, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { ComparisonColumn } from '../components/ComparisonColumn';

export type ComparisonScreenProps = {
  onBack: () => void;
  onPressTutor: (id: string) => void;
};

export function ComparisonScreen({ onBack, onPressTutor }: ComparisonScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { entries, count, limit, remove, clear } = useComparison();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Button
          label={t('common.back')}
          accessibilityLabel={t('common.back')}
          variant="ghost"
          size="compact"
          leadingIcon="arrow-left"
          onPress={onBack}
          style={styles.headerButton}
        />
        <Text variant="headline" numberOfLines={1} style={styles.title}>
          {t('comparison.title')}
        </Text>
        {count > 0 ? (
          <Button
            label={t('comparison.clear')}
            variant="ghost"
            size="compact"
            onPress={clear}
            style={styles.headerButton}
          />
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {count === 0 ? (
        <EmptyState
          icon="columns"
          title={t('comparison.emptyTitle')}
          description={t('comparison.emptyDescription')}
        />
      ) : (
        <>
          <Text variant="bodySmall" color="textSecondary" style={styles.subtitle}>
            {t('comparison.subtitle', { count, limit })}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.columns}
            testID="comparison-columns"
          >
            {entries.map((entry) => (
              <ComparisonColumn
                key={entry.id}
                entry={entry}
                onRemove={() => remove(entry.id)}
                onPress={() => onPressTutor(entry.id)}
              />
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerButton: {
    minWidth: 72,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  columns: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
});

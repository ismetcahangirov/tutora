/**
 * ProfileScreen — the student account + preferences surface (epic #40, #49).
 *
 * Composes the pieces a student manages about themselves: their identity (from the
 * in-memory auth user), preferences (appearance + language), their saved searches
 * (apply or delete), and sign-out. Server state is untouched — everything here is
 * either already-loaded auth state or local device settings — so the screen owns
 * no queries. Navigation out (applying a saved search opens the Search tab) is
 * injected, keeping the screen route-agnostic.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@features/auth';
import { useSavedSearches } from '@features/saved-searches';
import { Button, Text } from '@/components/ui';
import { LanguageSwitcher } from '@/shared/i18n';
import { ScreenLoader } from '@/shared';
import { spacing, useColors } from '@/theme';

import { AppearanceSetting } from '../components/AppearanceSetting';
import { ProfileHeader } from '../components/ProfileHeader';
import { SavedSearchRow } from '../components/SavedSearchRow';
import { SettingRow } from '../components/SettingRow';
import { SettingsGroup } from '../components/SettingsGroup';

export type ProfileScreenProps = {
  /** Apply a saved search — the route navigates to the Search tab with the preset. */
  onApplySavedSearch: (id: string) => void;
  /** Open the caller's own reviews (#48). */
  onOpenMyReviews: () => void;
};

export function ProfileScreen({ onApplySavedSearch, onOpenMyReviews }: ProfileScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { user, signOut } = useAuth();
  const { searches, remove } = useSavedSearches();

  // The (student) layout guards auth, so this is defensive: hold on a loader
  // rather than render a broken header if the user is momentarily absent.
  if (!user) {
    return <ScreenLoader />;
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Text variant="headline">{t('profile.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader user={user} />

        <SettingsGroup title={t('profile.sections.preferences')}>
          <View style={styles.stacked}>
            <SettingRow icon="moon" label={t('profile.appearance.label')} />
            <AppearanceSetting />
          </View>
          <SettingRow icon="globe" label={t('profile.language')} trailing={<LanguageSwitcher />} />
        </SettingsGroup>

        <SettingsGroup title={t('profile.sections.activity')}>
          <SettingRow icon="star" label={t('profile.myReviews')} onPress={onOpenMyReviews} />
        </SettingsGroup>

        <SettingsGroup title={t('profile.sections.savedSearches')}>
          {searches.length === 0 ? (
            <SettingRow
              icon="bookmark"
              label={t('profile.savedSearches.empty')}
              description={t('profile.savedSearches.emptyHint')}
            />
          ) : (
            searches.map((search) => (
              <SavedSearchRow
                key={search.id}
                search={search}
                onApply={() => onApplySavedSearch(search.id)}
                onDelete={() => remove(search.id)}
              />
            ))
          )}
        </SettingsGroup>

        <View style={styles.group}>
          <Text variant="label" color="textSecondary" style={styles.accountTitle}>
            {t('profile.sections.account')}
          </Text>
          <Button
            label={t('common.signOut')}
            variant="outline"
            leadingIcon="log-out"
            onPress={() => void signOut()}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing['2xl'],
  },
  group: {
    gap: spacing.sm,
  },
  // Appearance's segmented control is full-width, so it stacks under its label
  // (long option words like "Системное" would never fit as an inline trailing).
  stacked: {
    gap: spacing.sm,
  },
  accountTitle: {
    paddingHorizontal: spacing.xs,
    textTransform: 'uppercase',
  },
});

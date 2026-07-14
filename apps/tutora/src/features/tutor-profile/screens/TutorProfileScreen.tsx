/**
 * TutorProfileScreen — the tutor's Profile tab: build, price, and publish the
 * profile (tutor epic #51, #53, #56).
 *
 * A single scrollable surface rather than a nested wizard: the tutor edits their
 * basics (bio, experience, price, formats) with a save, manages their subjects /
 * districts / languages inline (each change persists immediately), and controls
 * verification + publication at the top. Every data state is handled — loading,
 * error with retry, and the loaded profile — plus a compact settings footer so a
 * tutor can switch language or sign out without leaving the tab.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@features/auth';
import { Avatar, Button, ErrorState, LoadingState, Text, useToast } from '@/components/ui';
import { LanguageSwitcher } from '@/shared/i18n';
import { spacing, useColors } from '@/theme';

import { CertificatesSection } from '../components/CertificatesSection';
import { ProfileBasicsForm } from '../components/ProfileBasicsForm';
import { ProfileCollectionsSection } from '../components/ProfileCollectionsSection';
import { PublishSection } from '../components/PublishSection';
import { useMyTutorProfile } from '../hooks/useMyTutorProfile';
import { useSubmitTutorVerification } from '../hooks/useSubmitTutorVerification';
import { useUpdateTutorProfile } from '../hooks/useUpdateTutorProfile';
import type { UpdateTutorProfileInput } from '../types';

export type TutorProfileScreenProps = {
  /** Navigate to the weekly availability editor (#55). Omitted → entry hidden. */
  onManageAvailability?: () => void;
  /** Navigate to the membership / subscription hub (#58). Omitted → entry hidden. */
  onManageSubscription?: () => void;
};

export function TutorProfileScreen({
  onManageAvailability,
  onManageSubscription,
}: TutorProfileScreenProps = {}) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { user, signOut } = useAuth();

  const { profile, isLoading, isError, refetch } = useMyTutorProfile();
  const { update, isUpdating } = useUpdateTutorProfile();
  const { submit, isSubmitting } = useSubmitTutorVerification();

  const runUpdate = async (input: UpdateTutorProfileInput, successKey: string) => {
    try {
      await update(input);
      toast.show({ message: t(successKey), type: 'success' });
    } catch {
      toast.show({ message: t('tutor.profile.error'), type: 'error' });
    }
  };

  const handleSubmitVerification = async () => {
    try {
      await submit();
      toast.show({ message: t('tutor.profile.publish.submitted'), type: 'success' });
    } catch {
      toast.show({ message: t('tutor.profile.error'), type: 'error' });
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Text variant="headline">{t('tutor.profile.title')}</Text>
      </View>

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError || !profile ? (
        <ErrorState
          title={t('tutor.profile.errorTitle')}
          description={t('tutor.profile.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Avatar uri={profile.avatarUrl} name={profile.name ?? user?.name ?? null} size={64} />
            <View style={styles.headerText}>
              <Text variant="title" numberOfLines={1}>
                {profile.name ?? user?.name ?? t('tutor.profile.unnamed')}
              </Text>
              <Text variant="bodySmall" color="textSecondary">
                {t('tutor.profile.viewsSummary', { count: profile.profileViews })}
              </Text>
            </View>
          </View>

          <PublishSection
            profile={profile}
            isUpdating={isUpdating}
            isSubmitting={isSubmitting}
            onTogglePublish={(next) =>
              void runUpdate({ isPublished: next }, 'tutor.profile.publish.updated')
            }
            onSubmitVerification={() => void handleSubmitVerification()}
          />

          <View style={styles.section}>
            <Text variant="subtitle">{t('tutor.profile.basics.title')}</Text>
            <ProfileBasicsForm
              profile={profile}
              isSaving={isUpdating}
              onSave={(input) => void runUpdate(input, 'tutor.profile.basics.saved')}
            />
          </View>

          <ProfileCollectionsSection profile={profile} />

          <CertificatesSection profile={profile} />

          <View style={[styles.settings, { borderTopColor: colors.border }]}>
            {onManageAvailability ? (
              <Button
                label={t('tutor.availability.entry')}
                variant="outline"
                leadingIcon="clock"
                onPress={onManageAvailability}
                fullWidth
              />
            ) : null}
            {onManageSubscription ? (
              <Button
                label={t('tutor.subscription.entry')}
                variant="outline"
                leadingIcon="award"
                onPress={onManageSubscription}
                fullWidth
              />
            ) : null}
            <View style={styles.settingRow}>
              <Text variant="body">{t('profile.language')}</Text>
              <LanguageSwitcher />
            </View>
            <Button
              label={t('common.signOut')}
              variant="outline"
              leadingIcon="log-out"
              onPress={() => void signOut()}
              fullWidth
            />
          </View>
        </ScrollView>
      )}
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
    paddingBottom: spacing['5xl'],
    gap: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  settings: {
    gap: spacing.lg,
    paddingTop: spacing['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

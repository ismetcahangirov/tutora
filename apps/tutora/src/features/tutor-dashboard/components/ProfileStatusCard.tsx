/**
 * ProfileStatusCard — profile readiness at a glance (tutor epic #51, #52).
 *
 * Surfaces the two gates that decide whether a tutor is discoverable: verification
 * state and whether the profile is published into search. When either is
 * unresolved it nudges the tutor to the Profile tab to finish setting up; when the
 * profile is live it simply confirms it. Reuses the profile feature's verification
 * badge so the status reads identically across the app.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Icon, Text } from '@/components/ui';
import { VerificationBadge, type MyTutorProfile } from '@features/tutor-profile';
import { spacing, useColors } from '@/theme';

export type ProfileStatusCardProps = {
  profile: MyTutorProfile;
  onManageProfile: () => void;
};

export function ProfileStatusCard({ profile, onManageProfile }: ProfileStatusCardProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const isLive = profile.verificationStatus === 'VERIFIED' && profile.isPublished;

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text variant="subtitle">{t('tutor.dashboard.status.title')}</Text>
        <VerificationBadge status={profile.verificationStatus} />
      </View>

      <View style={styles.row}>
        <Icon
          name={profile.isPublished ? 'verified' : 'alert-circle'}
          size={18}
          color={profile.isPublished ? 'success' : 'muted'}
        />
        <Text variant="bodySmall" color="textSecondary" style={styles.rowText}>
          {profile.isPublished
            ? t('tutor.dashboard.status.published')
            : t('tutor.dashboard.status.unpublished')}
        </Text>
      </View>

      {isLive ? (
        <View style={[styles.liveBanner, { backgroundColor: colors.surface }]}>
          <Icon name="check-check" size={18} color="success" />
          <Text variant="bodySmall" color="textSecondary" style={styles.rowText}>
            {t('tutor.dashboard.status.live')}
          </Text>
        </View>
      ) : (
        <Button
          label={t('tutor.dashboard.status.cta')}
          variant="outline"
          size="compact"
          leadingIcon="edit"
          onPress={onManageProfile}
          fullWidth
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.md,
  },
});

/**
 * PublishSection — verification status, submit-for-review, and the publish toggle
 * (tutor epic #51, #53, #54).
 *
 * The three states drive different affordances: an unverified/rejected profile can
 * be *submitted* for review; a pending one just shows it's under review; only a
 * verified profile can be *published* into search (the backend enforces this gate,
 * so the toggle only appears when it will take effect).
 */
import { StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import type { MyTutorProfile } from '../types';
import { VerificationBadge } from './VerificationBadge';

export type PublishSectionProps = {
  profile: MyTutorProfile;
  isUpdating: boolean;
  isSubmitting: boolean;
  onTogglePublish: (next: boolean) => void;
  onSubmitVerification: () => void;
};

export function PublishSection({
  profile,
  isUpdating,
  isSubmitting,
  onTogglePublish,
  onSubmitVerification,
}: PublishSectionProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const canSubmit =
    profile.verificationStatus === 'UNVERIFIED' || profile.verificationStatus === 'REJECTED';
  const isVerified = profile.verificationStatus === 'VERIFIED';
  const isPending = profile.verificationStatus === 'PENDING';

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Text variant="subtitle">{t('tutor.profile.publish.title')}</Text>
        <VerificationBadge status={profile.verificationStatus} />
      </View>

      {canSubmit ? (
        <>
          <Text variant="bodySmall" color="textSecondary">
            {t('tutor.profile.publish.submitHint')}
          </Text>
          <Button
            label={t('tutor.profile.publish.submit')}
            onPress={onSubmitVerification}
            loading={isSubmitting}
            fullWidth
          />
        </>
      ) : null}

      {isPending ? (
        <Text variant="bodySmall" color="textSecondary">
          {t('tutor.profile.publish.pendingHint')}
        </Text>
      ) : null}

      {isVerified ? (
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text variant="body">{t('tutor.profile.publish.published')}</Text>
            <Text variant="caption" color="textSecondary">
              {profile.isPublished
                ? t('tutor.profile.publish.publishedHint')
                : t('tutor.profile.publish.unpublishedHint')}
            </Text>
          </View>
          <Switch
            value={profile.isPublished}
            onValueChange={onTogglePublish}
            disabled={isUpdating}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel={t('tutor.profile.publish.published')}
          />
        </View>
      ) : null}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
});

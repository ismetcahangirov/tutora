/**
 * CertificateStatusBadge — the moderation status pill for one of the tutor's own
 * certificates (tutor epic #51, #54).
 *
 * Colour + icon encode the state (verified / under review / rejected) so it reads
 * at a glance and stays legible for colour-blind readers, mirroring the
 * profile-level `VerificationBadge`. Copy lives under
 * `tutor.profile.certificates.status.*`.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName, Text } from '@/components/ui';
import { radius, spacing, useColors, type ColorTokens } from '@/theme';

import type { CertificateStatus } from '../types';

type BadgeStyle = { color: keyof ColorTokens; icon: IconName };

const STATUS_STYLES: Record<CertificateStatus, BadgeStyle> = {
  VERIFIED: { color: 'success', icon: 'verified' },
  PENDING: { color: 'info', icon: 'clock' },
  REJECTED: { color: 'danger', icon: 'alert-circle' },
};

export type CertificateStatusBadgeProps = {
  status: CertificateStatus;
};

export function CertificateStatusBadge({ status }: CertificateStatusBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { color, icon } = STATUS_STYLES[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors[color] }]}
      accessibilityRole="text"
    >
      <Icon name={icon} size={12} color={color} />
      <Text variant="caption" color={color}>
        {t(`tutor.profile.certificates.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});

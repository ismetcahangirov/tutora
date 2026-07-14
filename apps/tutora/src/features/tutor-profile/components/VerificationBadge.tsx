/**
 * VerificationBadge — the tutor's own verification status pill (tutor epic #51, #54).
 *
 * Colour-codes the four states so a tutor sees at a glance where their profile
 * stands: verified (success), under review (info), rejected (danger), or not yet
 * submitted (muted). Copy is localized under `tutor.profile.verification.*`; the
 * icon reinforces the state for colour-blind readers.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName, Text } from '@/components/ui';
import { radius, spacing, useColors, type ColorTokens } from '@/theme';

import type { VerificationStatus } from '../types';

type BadgeStyle = { color: keyof ColorTokens; icon: IconName };

const STATUS_STYLES: Record<VerificationStatus, BadgeStyle> = {
  VERIFIED: { color: 'success', icon: 'verified' },
  PENDING: { color: 'info', icon: 'clock' },
  REJECTED: { color: 'danger', icon: 'alert-circle' },
  UNVERIFIED: { color: 'muted', icon: 'alert-circle' },
};

export type VerificationBadgeProps = {
  status: VerificationStatus;
};

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { color, icon } = STATUS_STYLES[status];
  const tint = colors[color];

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surface, borderColor: tint }]}
      accessibilityRole="text"
    >
      <Icon name={icon} size={14} color={color} />
      <Text variant="caption" color={color}>
        {t(`tutor.profile.verification.${status}`)}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

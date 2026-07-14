/**
 * ApplicationStatusBadge — colour-coded application status pill (tutor epic #51, #57).
 *
 * Maps each lifecycle state to a semantic colour so a tutor scans their inbox at a
 * glance: pending (warning), accepted (info), completed (success), and the closed
 * states (declined/cancelled/expired) in muted tones. Copy is localized under
 * `tutor.applications.status.*`.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { radius, spacing, useColors, type ColorTokens } from '@/theme';

import type { ApplicationStatus } from '../types';

const STATUS_COLOR: Record<ApplicationStatus, keyof ColorTokens> = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  COMPLETED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'muted',
  EXPIRED: 'muted',
};

export type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
};

export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const color = STATUS_COLOR[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors[color] }]}
      accessibilityRole="text"
    >
      <Text variant="caption" color={color}>
        {t(`tutor.applications.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

/**
 * VerificationBadge — a small "Verified" pill (student epic #40).
 *
 * Rendered only for verified tutors (search already filters to verified, but the
 * badge is explicit trust signalling on cards and the profile header). Uses the
 * `success` token for the shield-check icon and label.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

export type VerificationBadgeProps = {
  /** Show a text label next to the icon. Off on compact cards. Defaults to false. */
  showLabel?: boolean;
};

export function VerificationBadge({ showLabel = false }: VerificationBadgeProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.surface }]}
      accessibilityRole="text"
      accessibilityLabel={t('tutors.verified')}
    >
      <Icon name="verified" size={14} color="success" />
      {showLabel ? (
        <Text variant="caption" color="success">
          {t('tutors.verified')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});

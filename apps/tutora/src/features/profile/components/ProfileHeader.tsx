/**
 * ProfileHeader — the identity block at the top of the Profile screen (#49).
 *
 * Renders the signed-in student's avatar, name, email, and a role pill straight
 * from the auth user already in memory — no extra network call. Presentational:
 * the user is injected by the screen.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AuthUser } from '@features/auth';
import { Avatar, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

export type ProfileHeaderProps = {
  user: AuthUser;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View style={styles.header}>
      <Avatar uri={user.avatarUrl} name={user.name} size={72} />
      <View style={styles.identity}>
        <Text variant="title" numberOfLines={1}>
          {user.name}
        </Text>
        <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
          {user.email}
        </Text>
        <View style={[styles.rolePill, { backgroundColor: colors.primaryLight }]}>
          <Text variant="caption" color="primary">
            {t(`profile.roles.${user.role}`)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  identity: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  rolePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
});

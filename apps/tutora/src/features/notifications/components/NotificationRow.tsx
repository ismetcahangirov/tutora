/**
 * NotificationRow — one notification in the feed (#50).
 *
 * A fully-controlled presentational card: a type-tinted leading icon, the title,
 * a two-line body preview, an activity timestamp, and an unread dot. The whole
 * card is one tap target (→ mark read + deep-link), labelled for screen readers
 * with the title and read state. Unread rows lift the body weight so they stand out.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Icon, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { formatNotificationTime, iconForNotification } from '../presentation';
import type { AppNotification } from '../types';

export type NotificationRowProps = {
  notification: AppNotification;
  onPress: () => void;
};

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const unread = !notification.isRead;
  const timestamp = formatNotificationTime(notification.createdAt);
  const label = unread
    ? `${notification.title}, ${t('notifications.unreadA11y')}`
    : notification.title;

  return (
    <Card onPress={onPress} accessibilityLabel={label}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Icon name={iconForNotification(notification.type)} size={20} color="primary" />
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text variant="subtitle" numberOfLines={1} style={styles.title}>
              {notification.title}
            </Text>
            {timestamp ? (
              <Text variant="caption" color={unread ? 'primary' : 'muted'}>
                {timestamp}
              </Text>
            ) : null}
          </View>
          <Text
            variant="bodySmall"
            color={unread ? 'textPrimary' : 'textSecondary'}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>

        {unread ? <View style={[styles.dot, { backgroundColor: colors.danger }]} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

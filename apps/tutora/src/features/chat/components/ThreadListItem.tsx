/**
 * ThreadListItem — one conversation row in the Messages tab (#47).
 *
 * A fully-controlled presentational row: avatar, counterpart name, last-message
 * preview, activity timestamp, and an unread pill. The whole row is one tap
 * target (→ the thread), labelled for screen readers with the counterpart's name
 * and unread count. Unread rows lift the name/preview weight so they stand out.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { formatThreadTimestamp } from '../format';
import type { ChatThread } from '../types';

export type ThreadListItemProps = {
  thread: ChatThread;
  onPress: () => void;
};

export function ThreadListItem({ thread, onPress }: ThreadListItemProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const name = thread.counterpart.name ?? t('chat.unknownUser');
  const timestamp = formatThreadTimestamp(thread.lastMessageAt);
  const preview = thread.lastMessage?.body ?? t('chat.noMessagesYet');
  const hasUnread = thread.unreadCount > 0;
  // "Aygün, 2 unread" — a complete row description for screen readers.
  const label = hasUnread
    ? `${name}, ${t('chat.unreadCount', { count: thread.unreadCount })}`
    : name;

  return (
    <Card onPress={onPress} accessibilityLabel={label}>
      <View style={styles.row}>
        <Avatar uri={thread.counterpart.avatarUrl} name={thread.counterpart.name} size={52} />

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text variant="subtitle" numberOfLines={1} style={styles.name}>
              {name}
            </Text>
            {timestamp ? (
              <Text variant="caption" color={hasUnread ? 'primary' : 'muted'}>
                {timestamp}
              </Text>
            ) : null}
          </View>

          <View style={styles.bottomRow}>
            <Text
              variant="bodySmall"
              color={hasUnread ? 'textPrimary' : 'textSecondary'}
              numberOfLines={1}
              style={styles.preview}
            >
              {preview}
            </Text>
            {hasUnread ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text variant="caption" color="onPrimary">
                  {thread.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
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
  name: {
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

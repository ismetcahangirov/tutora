/**
 * NotificationsScreen — the in-app notification feed (#50).
 *
 * Lists the caller's notifications (loading / empty / error / populated all
 * handled), grows page-by-page on scroll, and refreshes on pull. Tapping a row
 * marks it read and, when the payload deep-links somewhere, routes there via the
 * injected `onOpen` (keeping the screen route-agnostic). "Mark all read" clears
 * every unread at once. Read state is server-owned; the screen owns no navigation.
 */
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, ErrorState, LoadingState, Text, useToast } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { NotificationRow } from '../components/NotificationRow';
import { resolveNotificationRoute, type NotificationRoute } from '../deep-link';
import { useMarkAllNotificationsRead } from '../hooks/useMarkAllNotificationsRead';
import { useMarkNotificationRead } from '../hooks/useMarkNotificationRead';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../types';

export type NotificationsScreenProps = {
  onBack: () => void;
  /** Navigate to a notification's deep-link target (feed self-links are skipped). */
  onOpen: (route: NotificationRoute) => void;
};

export function NotificationsScreen({ onBack, onOpen }: NotificationsScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const {
    notifications,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useNotifications();
  const { markRead } = useMarkNotificationRead();
  const { markAll, isPending } = useMarkAllNotificationsRead();

  const hasUnread = notifications.some((item) => !item.isRead);

  const handlePress = (notification: AppNotification) => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
    const route = resolveNotificationRoute(notification.data);
    // Skip the feed self-link — a tap that resolves to "/notifications" stays put.
    if (route.pathname !== '/notifications') {
      onOpen(route);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAll();
    } catch {
      toast.show({ message: t('notifications.markAllError'), type: 'error' });
    }
  };

  const renderItem: ListRenderItem<AppNotification> = ({ item }) => (
    <NotificationRow notification={item} onPress={() => handlePress(item)} />
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Button
          label={t('common.back')}
          accessibilityLabel={t('common.back')}
          variant="ghost"
          size="compact"
          leadingIcon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <Text variant="subtitle" numberOfLines={1} style={styles.headerTitle}>
          {t('notifications.title')}
        </Text>
        {hasUnread ? (
          <Button
            label={t('notifications.markAllRead')}
            variant="ghost"
            size="compact"
            onPress={() => void handleMarkAll()}
            loading={isPending}
          />
        ) : null}
      </View>

      {isLoading ? (
        <LoadingState label={t('common.loading')} />
      ) : isError ? (
        <ErrorState
          title={t('notifications.error')}
          retryLabel={t('common.retry')}
          onRetry={() => refetch()}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={ItemSeparator}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage ? <LoadingState /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title={t('notifications.empty')}
              description={t('notifications.emptyHint')}
            />
          }
          testID="notifications-list"
        />
      )}
    </SafeAreaView>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignSelf: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
});

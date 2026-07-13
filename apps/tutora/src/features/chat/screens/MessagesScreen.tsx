/**
 * MessagesScreen — the Messages tab: the caller's conversation list (#47).
 *
 * Lists threads newest-active first, with pull-to-refresh and infinite scroll.
 * Handles the four states explicitly: a skeleton list while loading, an error
 * with retry, an empty state that explains where conversations come from, and the
 * populated list. Tapping a row hands the thread id up to the router.
 */
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { ThreadListItem } from '../components/ThreadListItem';
import { ThreadListItemSkeleton } from '../components/ThreadListItemSkeleton';
import { useThreads } from '../hooks/useThreads';
import type { ChatThread } from '../types';

export type MessagesScreenProps = {
  onOpenThread: (thread: ChatThread) => void;
};

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

export function MessagesScreen({ onOpenThread }: MessagesScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const {
    threads,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useThreads();

  const renderItem = useCallback<ListRenderItem<ChatThread>>(
    ({ item }) => <ThreadListItem thread={item} onPress={() => onOpenThread(item)} />,
    [onOpenThread],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headline">{t('chat.title')}</Text>
      </View>

      {isLoading ? (
        <View style={[styles.content, styles.skeletonGap]}>
          {SKELETON_ROWS.map((row) => (
            <ThreadListItemSkeleton key={row} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          title={t('chat.errorTitle')}
          description={t('chat.errorDescription')}
          retryLabel={t('common.retry')}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="message-circle"
              title={t('chat.emptyTitle')}
              description={t('chat.emptyDescription')}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={colors.primary} />
            ) : null
          }
          testID="messages-thread-list"
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  // The skeleton list has no separators, so it supplies its own row gap.
  skeletonGap: {
    gap: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});

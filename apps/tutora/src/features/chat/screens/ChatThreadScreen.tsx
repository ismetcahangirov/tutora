/**
 * ChatThreadScreen — a single conversation's history + composer (#47).
 *
 * Lives at the root stack so it pushes full-screen over the tabs. Messages render
 * in an inverted list (newest at the bottom); scrolling up pages in older
 * history. Day separators mark calendar boundaries. Opening the thread marks its
 * incoming messages read, and the composer sends optimistically. The four states
 * — loading, error, empty, populated — are all handled, and the composer stays
 * available whenever the history is readable.
 */
import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, EmptyState, ErrorState, LoadingState, Text } from '@/components/ui';
import { formatShortDate } from '@/shared';
import { spacing, useColors } from '@/theme';

import { DateSeparator } from '../components/DateSeparator';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { dayKey, messageDayKind } from '../format';
import { useMarkThreadRead } from '../hooks/useMarkThreadRead';
import { useSendMessage } from '../hooks/useSendMessage';
import { useThreadMessages } from '../hooks/useThreadMessages';
import type { ChatMessage } from '../types';

export type ChatThreadScreenProps = {
  threadId: string;
  /** Counterpart name for the header; passed as a route param from the list. */
  title?: string | null;
  avatarUrl?: string | null;
  onBack: () => void;
};

export function ChatThreadScreen({ threadId, title, avatarUrl, onBack }: ChatThreadScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { messages, isLoading, isError, isFetchingNextPage, hasNextPage, refetch, fetchNextPage } =
    useThreadMessages(threadId);
  const { send, retry } = useSendMessage(threadId);
  const { markRead } = useMarkThreadRead(threadId);

  // Viewing a thread clears its unread messages. `markRead` is stable and the
  // screen mounts fresh per thread (route push), so this runs once on open.
  useEffect(() => {
    markRead();
  }, [markRead]);

  const dayLabel = useCallback(
    (iso: string): string => {
      const kind = messageDayKind(iso);
      if (kind === 'today') {
        return t('chat.today');
      }
      if (kind === 'yesterday') {
        return t('chat.yesterday');
      }
      return formatShortDate(iso);
    },
    [t],
  );

  const renderItem = useCallback<ListRenderItem<ChatMessage>>(
    ({ item, index }) => {
      // Inverted list: the next index is the older message. A message starts a
      // new day (and gets a separator above it) when the older one is a different
      // calendar day — or when it's the oldest loaded message.
      const older = messages[index + 1];
      const startsNewDay = !older || dayKey(older.createdAt) !== dayKey(item.createdAt);
      return (
        <View>
          {startsNewDay ? <DateSeparator label={dayLabel(item.createdAt)} /> : null}
          <MessageBubble message={item} onRetry={retry} />
        </View>
      );
    },
    [messages, dayLabel, retry],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ThreadHeader title={title ?? t('chat.conversation')} avatarUrl={avatarUrl} onBack={onBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing['2xl'] : 0}
      >
        {isLoading ? (
          <LoadingState label={t('common.loading')} />
        ) : isError ? (
          <ErrorState
            title={t('chat.errorTitle')}
            description={t('chat.errorDescription')}
            retryLabel={t('common.retry')}
            onRetry={refetch}
          />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            inverted={messages.length > 0}
            ItemSeparatorComponent={ItemSeparator}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <EmptyState
                icon="message-circle"
                title={t('chat.threadEmptyTitle')}
                description={t('chat.threadEmptyDescription')}
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} color={colors.primary} />
              ) : null
            }
            testID="chat-message-list"
          />
        )}

        {!isError ? <MessageComposer onSend={send} /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ThreadHeader({
  title,
  avatarUrl,
  onBack,
}: {
  title: string;
  avatarUrl?: string | null;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
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
      <View style={styles.headerIdentity}>
        <Avatar uri={avatarUrl ?? null} name={title} size={32} />
        <Text variant="subtitle" numberOfLines={1} style={styles.headerName}>
          {title}
        </Text>
      </View>
    </View>
  );
}

function ItemSeparator() {
  return <View style={styles.messageGap} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
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
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerName: {
    flexShrink: 1,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  messageGap: {
    height: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});

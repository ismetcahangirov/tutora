/**
 * MessageBubble — a single chat message (#47).
 *
 * Alignment carries the sender in a 1:1 thread: my messages hug the right on a
 * primary surface, the counterpart's hug the left on a neutral surface (so no
 * avatars are needed). The footer shows the send time and, for my messages, a
 * delivery cue — pending, delivered, read (double check), or failed. A failed
 * message is a tap target that re-sends it.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import { formatMessageTime } from '../format';
import type { ChatMessage } from '../types';

export type MessageBubbleProps = {
  message: ChatMessage;
  onRetry: (message: ChatMessage) => void;
};

/** Which delivery icon (if any) a sent message shows in its footer. */
function deliveryIcon(message: ChatMessage): IconName | null {
  if (!message.isMine) {
    return null;
  }
  switch (message.deliveryStatus) {
    case 'sending':
      return 'clock';
    case 'failed':
      return 'alert-circle';
    default:
      return message.readAt ? 'check-check' : 'check';
  }
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const { isMine } = message;
  const isFailed = message.deliveryStatus === 'failed';
  const isPending = message.deliveryStatus === 'sending';
  const icon = deliveryIcon(message);
  const footerColor = isMine ? 'onPrimary' : 'muted';

  const bubble = (
    <View
      style={[
        styles.bubble,
        isMine
          ? [styles.mine, { backgroundColor: colors.primary }]
          : [styles.theirs, { backgroundColor: colors.surface, borderColor: colors.border }],
        (isPending || isFailed) && styles.dimmed,
      ]}
    >
      <Text variant="body" color={isMine ? 'onPrimary' : 'textPrimary'}>
        {message.body}
      </Text>
      <View style={styles.footer}>
        <Text variant="caption" color={footerColor}>
          {formatMessageTime(message.createdAt)}
        </Text>
        {icon ? <Icon name={icon} size={13} color={isFailed ? 'warning' : footerColor} /> : null}
      </View>
    </View>
  );

  const alignment = isMine ? styles.rowMine : styles.rowTheirs;

  if (isFailed) {
    return (
      <Pressable
        onPress={() => onRetry(message)}
        accessibilityRole="button"
        accessibilityLabel={t('chat.retryFailed')}
        style={alignment}
      >
        {bubble}
      </Pressable>
    );
  }

  return <View style={alignment}>{bubble}</View>;
}

const styles = StyleSheet.create({
  rowMine: {
    alignItems: 'flex-end',
  },
  rowTheirs: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  // A subtle tail: square off the bottom corner on the sender's side.
  mine: {
    borderBottomRightRadius: radius.xs,
  },
  theirs: {
    borderWidth: 1,
    borderBottomLeftRadius: radius.xs,
  },
  dimmed: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
  },
});

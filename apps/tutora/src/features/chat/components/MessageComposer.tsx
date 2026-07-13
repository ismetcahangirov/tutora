/**
 * MessageComposer — the message input bar pinned to the bottom of a thread (#47).
 *
 * A growing multiline field plus a circular send button. Owns only its own draft
 * text; sending hands the trimmed body up and clears the field. Send is disabled
 * while the draft is empty, and the body is capped at the same length the backend
 * enforces so the request never bounces. The send target meets the 44px minimum.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui';
import { fontFamily, radius, spacing, useColors } from '@/theme';

import { MESSAGE_MAX_LENGTH } from '../constants';

export type MessageComposerProps = {
  onSend: (body: string) => void;
};

export function MessageComposer({ onSend }: MessageComposerProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    onSend(text);
    setText('');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('chat.composerPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
        maxLength={MESSAGE_MAX_LENGTH}
        accessibilityLabel={t('chat.messageInputLabel')}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          },
        ]}
      />

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel={t('chat.send')}
        accessibilityState={{ disabled: !canSend }}
        style={[styles.send, { backgroundColor: canSend ? colors.primary : colors.disabled }]}
      >
        <Icon name="send" size={20} color={canSend ? 'onPrimary' : 'muted'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

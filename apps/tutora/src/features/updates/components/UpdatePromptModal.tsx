import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Modal, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import type { AppUpdateStatus } from '../hooks/useAppUpdates';

export type UpdatePromptModalProps = {
  status: AppUpdateStatus;
  downloadProgress: number | undefined;
  onApply: () => void;
  onDismiss: () => void;
};

export function UpdatePromptModal({
  status,
  downloadProgress,
  onApply,
  onDismiss,
}: UpdatePromptModalProps) {
  const { t } = useTranslation();
  const colors = useColors();

  if (status === 'restarting') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.primary }]}>
        <Text variant="subtitle" color="onPrimary">
          {t('updates.restarting')}
        </Text>
      </View>
    );
  }

  if (status === 'idle') {
    return null;
  }

  const progressPercent = Math.round((downloadProgress ?? 0) * 100);

  return (
    <Modal
      visible
      onClose={onDismiss}
      title={t('updates.title')}
      hideCloseButton={status === 'downloading'}
    >
      <Text variant="body">{t('updates.message')}</Text>

      {status === 'downloading' ? (
        <View style={styles.progressSection}>
          <Text variant="caption">{t('updates.downloading')}</Text>
          <View
            style={[styles.track, { backgroundColor: colors.disabled }]}
            accessibilityLabel={`${t('updates.downloading')}, ${progressPercent}%`}
          >
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button variant="outline" label={t('updates.later')} onPress={onDismiss} />
          <Button variant="primary" label={t('updates.updateNow')} onPress={onApply} />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  progressSection: {
    gap: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});

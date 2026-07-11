/**
 * Modal — centered dialog on a dimmed backdrop (issue #13).
 *
 * Built on React Native's `Modal`. Tapping the backdrop closes it; an always-present
 * close (X) action gives an explicit dismissal. Width is capped for large screens.
 */
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ModalProps as RNModalProps,
} from 'react-native';

import { radius, spacing, useColors } from '@/theme';

import { Icon } from './icon';
import { Text } from './text';

export type ModalProps = Pick<RNModalProps, 'onRequestClose'> & {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Hide the default close (X) button when a custom dismissal is provided. */
  hideCloseButton?: boolean;
};

const MAX_WIDTH = 400;

export function Modal({ visible, onClose, title, children, hideCloseButton = false }: ModalProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width - spacing['5xl'], MAX_WIDTH);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
        accessibilityLabel="Close"
      >
        {/* Stop propagation so taps inside the card do not dismiss. */}
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, width: containerWidth }]}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          {(title || !hideCloseButton) && (
            <View style={styles.header}>
              {title ? (
                <Text variant="subtitle" style={styles.title}>
                  {title}
                </Text>
              ) : (
                <View style={styles.title} />
              )}
              {!hideCloseButton ? (
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={12}
                >
                  <Icon name="close" size={22} color="textSecondary" />
                </Pressable>
              ) : null}
            </View>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
});

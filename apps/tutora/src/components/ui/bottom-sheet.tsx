/**
 * BottomSheet — controlled overlay built on `@gorhom/bottom-sheet` (issue #13).
 *
 * Driven by a `visible` prop (open at index 0, closed at -1). Pan-down and
 * backdrop taps both close it and call `onClose`, so callers keep a single source
 * of truth. Uses dynamic sizing when no `snapPoints` are given. Requires a
 * `GestureHandlerRootView` ancestor (added in the root layout).
 */
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { Text } from './text';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Explicit snap points; omit to use dynamic content sizing. */
  snapPoints?: (string | number)[];
  title?: string;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, snapPoints, title, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const ref = useRef<GorhomBottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <GorhomBottomSheet
      ref={ref}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.border }]}
      backgroundStyle={[styles.background, { backgroundColor: colors.card }]}
    >
      <BottomSheetView style={styles.content} accessibilityViewIsModal>
        {title ? (
          <Text variant="subtitle" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 32,
    height: 4,
  },
  background: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  title: {
    marginBottom: spacing.xs,
  },
});

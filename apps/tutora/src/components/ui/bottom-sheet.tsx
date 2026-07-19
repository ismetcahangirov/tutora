/**
 * BottomSheet — controlled overlay built on `@gorhom/bottom-sheet` (issue #13).
 *
 * Driven by a `visible` prop. Opening/closing is issued imperatively via gorhom's
 * own ref methods (`snapToIndex`/`close`) rather than by diffing the `index` prop —
 * `index` only reflects the *initial* render. A purely declarative `index` prop
 * can desync from the sheet's actual animated position after a pan gesture
 * settles mid-transition, silently swallowing the next open/close request; the
 * imperative call always converges regardless of the sheet's current state (#176).
 * Pan-down and backdrop taps both close it and call `onClose`, so callers keep a
 * single source of truth. Uses dynamic sizing when no `snapPoints` are given, or
 * pass `scrollable` for content that can exceed the sheet's height. Requires a
 * `GestureHandlerRootView` ancestor (added in the root layout).
 */
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { Text } from './text';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Explicit snap points; omit to use dynamic content sizing. */
  snapPoints?: (string | number)[];
  title?: string;
  /** Render content in a scrollable container — for content taller than the sheet. Defaults to false. */
  scrollable?: boolean;
  children: ReactNode;
};

export function BottomSheet({
  visible,
  onClose,
  snapPoints,
  title,
  scrollable = false,
  children,
}: BottomSheetProps) {
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

  // Sync external system: gorhom's sheet owns its own animated position, so
  // opening/closing is a command, not a prop diff (see file doc comment).
  // `snapToIndex(0)` (not `expand()`, which snaps to the *largest* point) keeps
  // the original semantics of opening to the first snap point.
  useEffect(() => {
    if (visible) {
      ref.current?.snapToIndex(0);
    } else {
      ref.current?.close();
    }
  }, [visible]);

  const titleNode = title ? (
    <Text variant="subtitle" style={styles.title}>
      {title}
    </Text>
  ) : null;

  return (
    <GorhomBottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.border }]}
      backgroundStyle={[styles.background, { backgroundColor: colors.card }]}
    >
      {scrollable ? (
        <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {titleNode}
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={styles.content} accessibilityViewIsModal>
          {titleNode}
          {children}
        </BottomSheetView>
      )}
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

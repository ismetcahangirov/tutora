/**
 * Global Jest setup for the Tutora mobile app.
 *
 * `@gorhom/bottom-sheet` transitively pulls in Reanimated → react-native-worklets,
 * which cannot initialize under the Jest (node) environment. Since it is the only
 * Reanimated consumer in the UI kit (every other component animates with RN's
 * `Animated`), we stub the sheet to plain views so component imports load cleanly.
 * Gesture Handler ships its own Jest setup that stubs its native module.
 */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const { View } = jest.requireActual('react-native') as typeof import('react-native');

  const BottomSheet = React.forwardRef<unknown, { children?: React.ReactNode }>(
    function BottomSheet({ children }, _ref) {
      return React.createElement(View, null, children);
    },
  );

  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: Passthrough,
    BottomSheetScrollView: Passthrough,
    BottomSheetBackdrop: () => null,
  };
});

/**
 * Avatar — a photo with an initials fallback (student epic #40).
 *
 * Generic person avatar used for tutors and review authors. `expo-image` gives
 * fast, cached remote photos; with no photo (or no name) it renders a tinted
 * circle with initials so the UI never shows a broken image. Decorative by
 * default — the surrounding row/card owns the accessible name.
 */
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { radius, useColors } from '@/theme';

import { Text } from './text';
import type { TextVariant } from '@/theme';

export type AvatarProps = {
  uri: string | null;
  name: string | null;
  /** Diameter in px. Defaults to 56. */
  size?: number;
};

/** First letters of up to two words, uppercased. Falls back to "?". */
export function initialsOf(name: string | null): string {
  if (!name) {
    return '?';
  }
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  return letters.toUpperCase() || '?';
}

/** Scale the initials text down for smaller avatars. */
function initialsVariant(size: number): TextVariant {
  if (size <= 36) {
    return 'label';
  }
  if (size <= 48) {
    return 'body';
  }
  return 'subtitle';
}

export function Avatar({ uri, name, size = 56 }: AvatarProps) {
  const colors = useColors();
  const dimensions = { width: size, height: size, borderRadius: radius.full };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={dimensions}
        contentFit="cover"
        transition={150}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <View
      style={[dimensions, styles.fallback, { backgroundColor: colors.primaryLight }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text variant={initialsVariant(size)} color="primary">
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

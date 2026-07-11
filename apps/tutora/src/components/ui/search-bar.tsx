/**
 * SearchBar — pill-shaped search input (issue #15).
 *
 * Controlled via `value`/`onChangeText`. Pass `onDebouncedChange` to receive the
 * query after a quiet period (default 300 ms) so screens can debounce network
 * calls. A clear (X) affordance appears once there is text.
 */
import { useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Pressable,
  type StyleProp,
  type ViewStyle,
  type TextInputProps,
} from 'react-native';

import { fontFamily, radius, spacing, useColors } from '@/theme';

import { Icon } from './icon';

export type SearchBarProps = Pick<
  TextInputProps,
  'placeholder' | 'autoFocus' | 'returnKeyType' | 'onSubmitEditing'
> & {
  value: string;
  onChangeText: (text: string) => void;
  onDebouncedChange?: (text: string) => void;
  debounceMs?: number;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SearchBar({
  value,
  onChangeText,
  onDebouncedChange,
  debounceMs = 300,
  onClear,
  placeholder,
  style,
  ...inputProps
}: SearchBarProps) {
  const colors = useColors();

  useEffect(() => {
    if (!onDebouncedChange) {
      return;
    }
    const timer = setTimeout(() => onDebouncedChange(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onDebouncedChange]);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Icon name="search" size={20} color="muted" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={placeholder ?? 'Search'}
        style={[styles.input, { color: colors.textPrimary }]}
        {...inputProps}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Icon name="close" size={18} color="muted" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    paddingVertical: 0,
  },
});

/**
 * Input — text field with label, helper, and error states (issue #12).
 *
 * Border color reflects state: danger (error) → primary (focused) → border. The
 * field is uncontrolled-friendly (forwards a ref to the native `TextInput`) and
 * announces validation errors to screen readers via a live region.
 */
import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { fontFamily, radius, spacing, useColors } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type InputProps = Omit<TextInputProps, 'style' | 'editable'> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  onTrailingIconPress?: () => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    helperText,
    errorText,
    leadingIcon,
    trailingIcon,
    onTrailingIconPress,
    disabled = false,
    multiline = false,
    onFocus,
    onBlur,
    containerStyle,
    ...rest
  },
  ref,
) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);
  const borderColor = hasError ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          { borderColor, backgroundColor: disabled ? colors.surface : colors.card },
        ]}
      >
        {leadingIcon ? <Icon name={leadingIcon} size={20} color="muted" /> : null}

        <TextInput
          ref={ref}
          editable={!disabled}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.textPrimary }]}
          accessibilityLabel={label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />

        {trailingIcon ? (
          <Pressable
            onPress={onTrailingIconPress}
            accessibilityRole="button"
            hitSlop={8}
            disabled={!onTrailingIconPress}
          >
            <Icon name={trailingIcon} size={20} color="muted" />
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <Text
          variant="caption"
          color="danger"
          style={styles.helper}
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="textSecondary" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
  },
  // Multiline grows downward with the text pinned to the top of a taller box.
  fieldMultiline: {
    minHeight: 112,
    alignItems: 'stretch',
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fontFamily.regular,
  },
  helper: {
    marginTop: spacing.xs,
  },
});

/**
 * Standardized screen states (issue #14).
 *
 * `LoadingState`, `EmptyState`, and `ErrorState` give every data-driven screen a
 * consistent loading / empty / error treatment. Copy is passed in by the caller
 * (so it can be localized once i18n lands); only fallback action labels default to
 * English. Loading announces itself to screen readers.
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useColors } from '@/theme';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export type LoadingStateProps = { label?: string };

export function LoadingState({ label }: LoadingStateProps) {
  const colors = useColors();
  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityLabel={label ?? 'Loading'}
    >
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? (
        <Text variant="bodySmall" color="textSecondary" style={styles.caption}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={40} color="muted" />
      <Text variant="title" align="center" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="textSecondary" align="center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="primary" style={styles.action} />
      ) : null}
    </View>
  );
}

export type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Something went wrong',
  description,
  retryLabel = 'Retry',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Icon name="alert-circle" size={40} color="danger" />
      <Text variant="title" align="center" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="textSecondary" align="center">
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="outline" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
  },
  title: {
    marginTop: spacing.xs,
  },
  caption: {
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.md,
  },
});

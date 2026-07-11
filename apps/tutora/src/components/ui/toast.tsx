/**
 * Toast — transient feedback with a single-at-a-time queue (issue #13).
 *
 * `ToastProvider` renders the host and exposes `show`/`hide` via `useToast`.
 * Success/info appear at the top; errors at the bottom. Only one toast shows at a
 * time — additional calls queue. Animation uses RN's `Animated` (subtle 200 ms
 * fade) and each toast is an `alert` live region for screen readers.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, shadows, spacing, useColors, type ColorTokens } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import {
  ToastContext,
  type ToastContextValue,
  type ToastOptions,
  type ToastType,
} from './toast-context';

type ActiveToast = ToastOptions & { key: number };

type ToastVisual = {
  background: keyof ColorTokens;
  text: keyof ColorTokens;
  icon: IconName | null;
};

const VISUALS: Record<ToastType, ToastVisual> = {
  default: { background: 'textPrimary', text: 'background', icon: null },
  success: { background: 'success', text: 'onPrimary', icon: 'check' },
  error: { background: 'danger', text: 'onPrimary', icon: 'alert-circle' },
  info: { background: 'info', text: 'onPrimary', icon: 'alert-circle' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ActiveToast | null>(null);
  const queue = useRef<ToastOptions[]>([]);
  const keyRef = useRef(0);

  const showNext = useCallback(() => {
    const next = queue.current.shift();
    setCurrent(next ? { ...next, key: ++keyRef.current } : null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    setCurrent((prev) => {
      if (prev) {
        queue.current.push(options);
        return prev;
      }
      return { ...options, key: ++keyRef.current };
    });
  }, []);

  const hide = useCallback(() => showNext(), [showNext]);

  const value = useMemo<ToastContextValue>(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current ? <ToastHost key={current.key} toast={current} onDismiss={showNext} /> : null}
    </ToastContext.Provider>
  );
}

function ToastHost({ toast, onDismiss }: { toast: ActiveToast; onDismiss: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const type = toast.type ?? 'default';
  const visual = VISUALS[type];
  const atBottom = type === 'error';
  const duration = toast.duration ?? (atBottom ? 5000 : 3000);

  // Lazy state init keeps stable Animated.Values without reading refs during render.
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(atBottom ? 12 : -12));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) {
            onDismiss();
          }
        },
      );
    }, duration);

    return () => clearTimeout(timer);
  }, [opacity, translateY, duration, onDismiss]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        shadows.md,
        {
          backgroundColor: colors[visual.background],
          opacity,
          transform: [{ translateY }],
        },
        atBottom ? { bottom: insets.bottom + spacing['4xl'] } : { top: insets.top + spacing.lg },
      ]}
    >
      {visual.icon ? <Icon name={visual.icon} size={18} color={visual.text} /> : null}
      <Text variant="bodySmall" color={visual.text} style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  message: {
    flex: 1,
  },
});

/**
 * AppearanceSetting — light / dark / system segmented control (epic #40, #49).
 *
 * Reads and sets the theme preference via `useThemeMode`; the root layout persists
 * every change to MMKV, so the choice survives restarts. Presentational beyond the
 * theme hook (like `LanguageSwitcher`), so it drops straight into a setting row.
 * `system` follows the OS scheme — the default.
 */
import { StyleSheet, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { radius, spacing, useColors, useThemeMode, type ThemePreference } from '@/theme';

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export function AppearanceSetting() {
  const { t } = useTranslation();
  const colors = useColors();
  const { preference, setPreference } = useThemeMode();

  return (
    <View style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {OPTIONS.map((option) => {
        const isActive = preference === option;
        return (
          <Pressable
            key={option}
            onPress={() => setPreference(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[styles.segment, isActive && { backgroundColor: colors.card }]}
          >
            <Text
              variant="caption"
              color={isActive ? 'primary' : 'textSecondary'}
              numberOfLines={1}
            >
              {t(`profile.appearance.${option}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: radius.full,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

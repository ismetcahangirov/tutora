/**
 * LanguageSwitcher — az / en / ru pills (issue #82).
 *
 * Presentational: reads and sets the active language via `useLanguage`. Labels
 * are autonyms' short codes; the active pill fills with the primary color.
 */
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from './languages';
import { useLanguage } from './use-language';

export function LanguageSwitcher() {
  const colors = useColors();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.row} accessibilityLabel={t('common.selectLanguage')}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = lang === language;
        return (
          <Pressable
            key={lang}
            onPress={() => setLanguage(lang)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={LANGUAGE_LABELS[lang]}
            hitSlop={spacing.sm}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.primary : 'transparent',
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
          >
            <Text variant="caption" color={isActive ? 'onPrimary' : 'textSecondary'}>
              {lang.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pill: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

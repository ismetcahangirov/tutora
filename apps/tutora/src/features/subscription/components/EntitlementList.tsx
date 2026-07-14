/**
 * EntitlementList — the tutor-facing benefits a plan grants (#58).
 *
 * Shows the three capabilities that matter to a tutor (featured placement in
 * search, analytics, priority support) as included / not-included rows. The
 * numeric student limits on `Entitlements` are intentionally omitted here — this
 * screen sells premium visibility, not application quotas. Each row is labelled
 * with its inclusion for screen readers.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { Entitlements } from '../types';

export type EntitlementListProps = {
  entitlements: Entitlements;
};

/** The boolean, tutor-relevant capabilities, in display order. */
const TUTOR_FEATURES = ['featuredProfile', 'analytics', 'prioritySupport'] as const;

export function EntitlementList({ entitlements }: EntitlementListProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.list}>
      {TUTOR_FEATURES.map((key) => {
        const included = entitlements[key];
        const label = t(`tutor.subscription.features.${key}`);
        const state = t(`tutor.subscription.features.${included ? 'yes' : 'no'}`);
        return (
          <View key={key} style={styles.row} accessibilityLabel={`${label}: ${state}`}>
            <Icon
              name={included ? 'check' : 'close'}
              size={18}
              color={included ? 'success' : 'muted'}
            />
            <Text variant="body" color={included ? 'textPrimary' : 'muted'} style={styles.label}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
});

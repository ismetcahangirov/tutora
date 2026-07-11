/**
 * RoleSelectionScreen — Student / Tutor choice (issue #23).
 *
 * Presentational: selection, submit, and error come from `useRoleSelection`.
 * The continue action is disabled until a role is picked; on success the routing
 * gate takes over. Cards are exposed as radios for assistive tech.
 */
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Icon, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import { ONBOARDING_COPY, ROLE_OPTIONS } from '../constants';
import { useRoleSelection } from '../hooks/useRoleSelection';

export function RoleSelectionScreen() {
  const colors = useColors();
  const { selectedRole, selectRole, submit, isSubmitting, error } = useRoleSelection();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="headline">{ONBOARDING_COPY.role.title}</Text>
          <Text variant="body" color="textSecondary">
            {ONBOARDING_COPY.role.subtitle}
          </Text>
        </View>

        <View style={styles.options}>
          {ROLE_OPTIONS.map((option) => {
            const isSelected = option.role === selectedRole;
            return (
              <Card
                key={option.role}
                onPress={() => selectRole(option.role)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.title}
                style={isSelected ? { borderColor: colors.primary, borderWidth: 2 } : undefined}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionText}>
                    <Text variant="subtitle">{option.title}</Text>
                    <Text variant="bodySmall" color="textSecondary">
                      {option.description}
                    </Text>
                  </View>
                  {isSelected ? <Icon name="check" color="primary" /> : null}
                </View>
              </Card>
            );
          })}
        </View>

        {error ? (
          <Text variant="bodySmall" color="danger">
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Button
          label={ONBOARDING_COPY.role.continue}
          size="large"
          fullWidth
          disabled={!selectedRole}
          loading={isSubmitting}
          onPress={submit}
          accessibilityLabel={ONBOARDING_COPY.role.continue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    gap: spacing['2xl'],
  },
  header: {
    gap: spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  optionText: {
    flex: 1,
    gap: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});

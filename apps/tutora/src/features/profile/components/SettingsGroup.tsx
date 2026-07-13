/**
 * SettingsGroup — a titled card of setting rows (student epic #40, #49).
 *
 * Wraps its children in a single card under a small section title and draws a
 * hairline divider between rows, giving the Profile screen the familiar grouped
 * "settings list" look. Falsy children (e.g. a conditionally-rendered row) are
 * skipped so no stray dividers appear.
 */
import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

export type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const colors = useColors();
  const rows = Children.toArray(children);

  return (
    <View style={styles.group}>
      <Text variant="label" color="textSecondary" style={styles.title}>
        {title}
      </Text>
      <Card>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  title: {
    paddingHorizontal: spacing.xs,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
});

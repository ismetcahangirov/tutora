/**
 * MessagesTabIcon — the Messages tab icon with an unread badge (#47).
 *
 * Lives inside the tab bar (which only mounts for an authenticated student), so
 * its `useUnreadCount` poll never fires on the auth/onboarding screens. The badge
 * caps at `99+` so a large count can't blow out the tab bar.
 */
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { useColors } from '@/theme';

import { UNREAD_BADGE_MAX } from '../constants';
import { useUnreadCount } from '../hooks/useUnreadCount';

export type MessagesTabIconProps = {
  focused: boolean;
};

export function MessagesTabIcon({ focused }: MessagesTabIconProps) {
  const colors = useColors();
  const { count } = useUnreadCount();

  const label = count > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : String(count);

  return (
    <View>
      <Icon name="message-circle" size={24} color={focused ? 'primary' : 'muted'} />
      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.card }]}>
          <Text variant="caption" color="onPrimary">
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

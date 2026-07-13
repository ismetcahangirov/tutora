/**
 * Notifications feature — public barrel (student epic #40, #50).
 *
 * Push registration + the in-app notification feed. Import from here into the
 * route/shell files:
 *   `import { NotificationsBridge, NotificationsScreen } from '@features/notifications';`
 */
export { NotificationsScreen, type NotificationsScreenProps } from './screens/NotificationsScreen';

export { NotificationsBridge } from './components/NotificationsBridge';
export { NotificationsBadge, type NotificationsBadgeProps } from './components/NotificationsBadge';

export {
  useUnreadNotificationsCount,
  type UseUnreadNotificationsCountResult,
} from './hooks/useUnreadNotificationsCount';

export type { NotificationRoute } from './deep-link';
export type { AppNotification, NotificationType } from './types';

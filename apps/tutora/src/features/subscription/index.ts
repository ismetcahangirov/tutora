/**
 * Subscription feature — public barrel (tutor epic #51, #58; backend billing #36).
 *
 * The tutor's membership hub: view plans + entitlements, subscribe, cancel, and
 * read the payment history.
 *   `import { SubscriptionScreen } from '@features/subscription';`
 */
export { SubscriptionScreen, type SubscriptionScreenProps } from './screens/SubscriptionScreen';

export {
  useSubscriptionSummary,
  type UseSubscriptionSummaryResult,
} from './hooks/useSubscriptionSummary';
export { subscriptionKeys } from './constants';

export type {
  PlanTier,
  SubscriptionStatus,
  PaymentStatus,
  Entitlements,
  SubscriptionPlan,
  Subscription,
  EntitlementSummary,
  Payment,
  SubscribeInput,
} from './types';

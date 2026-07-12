import { PaymentStatus } from '@prisma/client';

/**
 * Payment lifecycle as a small state machine (#36). A payment starts PENDING
 * when a subscription is taken out; a gateway webhook — or an admin reconciling
 * manually — drives it to a terminal state. Terminal states have no outgoing
 * edges.
 *
 *   PENDING ──▶ SUCCEEDED ──▶ REFUNDED
 *      └───────▶ FAILED
 */
export const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, PaymentStatus[]>> = {
  [PaymentStatus.PENDING]: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED],
  [PaymentStatus.SUCCEEDED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.REFUNDED]: [],
};

/** Whether moving a payment from `from` to `to` is a legal transition. */
export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

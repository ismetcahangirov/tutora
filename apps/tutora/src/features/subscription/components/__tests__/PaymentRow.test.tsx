/**
 * PaymentRow (#58) — one entry in the payment history: amount, status, and date.
 */
import { renderWithProviders, screen } from '@/test-utils';

import type { Payment } from '@features/subscription/types';
import { PaymentRow } from '../PaymentRow';

const PAYMENT: Payment = {
  id: 'pay1',
  amount: 9.9,
  currency: 'AZN',
  status: 'SUCCEEDED',
  provider: 'stripe',
  providerRef: 'ch_123',
  subscriptionId: 's1',
  createdAt: '2026-07-01T09:00:00.000Z',
  updatedAt: '2026-07-01T09:00:00.000Z',
};

describe('PaymentRow (#58)', () => {
  it('renders the amount and a status label', async () => {
    await renderWithProviders(<PaymentRow payment={PAYMENT} />);

    expect(screen.getByText('9.90 ₼')).toBeTruthy();
    expect(screen.getByText('Paid')).toBeTruthy();
  });
});

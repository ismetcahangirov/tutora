/**
 * subscription API (#58) — endpoints + params for reading plans, the caller's
 * standing, subscribing, cancelling, and the payment history. The shared client
 * is mocked so only the request shape is asserted.
 */
import { apiClient } from '@/shared/lib';
import { SUBSCRIPTION_ENDPOINTS } from '@features/subscription/constants';

import {
  cancelSubscription,
  getPayments,
  getSubscriptionPlans,
  getSubscriptionSummary,
  subscribeToPlan,
} from '../subscription.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

describe('getSubscriptionPlans (#58)', () => {
  it('requests the public plans catalogue and returns the list', async () => {
    mockedGet.mockResolvedValueOnce({ data: [{ id: 'p1', tier: 'PRO' }] });

    const plans = await getSubscriptionPlans();

    expect(mockedGet).toHaveBeenCalledWith(SUBSCRIPTION_ENDPOINTS.plans);
    expect(plans).toEqual([{ id: 'p1', tier: 'PRO' }]);
  });
});

describe('getSubscriptionSummary (#58)', () => {
  it('requests the caller billing summary and returns it', async () => {
    mockedGet.mockResolvedValueOnce({ data: { tier: 'FREE', subscription: null } });

    const summary = await getSubscriptionSummary();

    expect(mockedGet).toHaveBeenCalledWith(SUBSCRIPTION_ENDPOINTS.summary);
    expect(summary).toEqual({ tier: 'FREE', subscription: null });
  });
});

describe('subscribeToPlan (#58)', () => {
  it('posts the chosen tier to the subscribe endpoint', async () => {
    mockedPost.mockResolvedValueOnce({ data: { id: 's1', tier: 'PRO' } });

    const subscription = await subscribeToPlan({ tier: 'PRO' });

    expect(mockedPost).toHaveBeenCalledWith(SUBSCRIPTION_ENDPOINTS.subscribe, { tier: 'PRO' });
    expect(subscription).toEqual({ id: 's1', tier: 'PRO' });
  });
});

describe('cancelSubscription (#58)', () => {
  it('posts to the cancel endpoint and returns the updated subscription', async () => {
    mockedPost.mockResolvedValueOnce({ data: { id: 's1', status: 'CANCELED' } });

    const subscription = await cancelSubscription();

    expect(mockedPost).toHaveBeenCalledWith(SUBSCRIPTION_ENDPOINTS.cancel);
    expect(subscription).toEqual({ id: 's1', status: 'CANCELED' });
  });
});

describe('getPayments (#58)', () => {
  it('requests the payments endpoint with paging params', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: {} } });

    await getPayments(2, 5);

    expect(mockedGet).toHaveBeenCalledWith(SUBSCRIPTION_ENDPOINTS.payments, {
      params: { page: 2, limit: 5 },
    });
  });

  it('defaults to the first page of 20', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [], meta: {} } });

    await getPayments();

    expect(mockedGet).toHaveBeenCalledWith(SUBSCRIPTION_ENDPOINTS.payments, {
      params: { page: 1, limit: 20 },
    });
  });
});

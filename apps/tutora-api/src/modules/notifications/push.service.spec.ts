import type { ConfigService } from '@nestjs/config';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PushService } from './push.service';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
  initializeApp: jest.fn(() => ({ name: 'tutora' })),
  cert: jest.fn(() => ({})),
}));
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}));

const CONFIGURED = {
  FIREBASE_PROJECT_ID: 'proj',
  FIREBASE_CLIENT_EMAIL: 'svc@proj.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN KEY-----\\nabc\\n-----END KEY-----',
};

function configFrom(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

/** A fake FCM `Messaging` whose `sendEachForMulticast` is a controllable jest.fn(). */
function fakeMessaging() {
  const sendEachForMulticast = jest.fn();
  (getMessaging as jest.Mock).mockReturnValue({ sendEachForMulticast });
  return sendEachForMulticast;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getApps as jest.Mock).mockReturnValue([]);
  (initializeApp as jest.Mock).mockReturnValue({ name: 'tutora' });
});

describe('PushService (unconfigured)', () => {
  it('is not configured and no-ops without touching FCM', async () => {
    const service = new PushService(configFrom({}));

    expect(service.isConfigured).toBe(false);
    const result = await service.sendToTokens(['t1'], { title: 'T', body: 'B' });

    expect(result).toEqual({ successCount: 0, failureCount: 0, invalidTokens: [] });
    expect(getMessaging).not.toHaveBeenCalled();
  });
});

describe('PushService (configured)', () => {
  it('initializes FCM once and reports configured', () => {
    fakeMessaging();
    const service = new PushService(configFrom(CONFIGURED));

    expect(service.isConfigured).toBe(true);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it('sends a multicast and collects dead tokens to prune', async () => {
    const send = fakeMessaging();
    send.mockResolvedValueOnce({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
      ],
    });
    const service = new PushService(configFrom(CONFIGURED));

    const result = await service.sendToTokens(['live', 'dead'], { title: 'T', body: 'B' });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['live', 'dead'],
        notification: { title: 'T', body: 'B' },
      }),
    );
    expect(result).toEqual({ successCount: 1, failureCount: 1, invalidTokens: ['dead'] });
  });

  it('de-duplicates tokens and no-ops on an empty list', async () => {
    const send = fakeMessaging();
    send.mockResolvedValue({ successCount: 1, failureCount: 0, responses: [{ success: true }] });
    const service = new PushService(configFrom(CONFIGURED));

    await service.sendToTokens(['same', 'same'], { title: 'T', body: 'B' });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ tokens: ['same'] }));

    send.mockClear();
    const empty = await service.sendToTokens([], { title: 'T', body: 'B' });
    expect(send).not.toHaveBeenCalled();
    expect(empty.successCount).toBe(0);
  });

  it('chunks large token lists to FCM’s 500-per-request limit', async () => {
    const send = fakeMessaging();
    send.mockResolvedValue({ successCount: 0, failureCount: 0, responses: [] });
    const service = new PushService(configFrom(CONFIGURED));

    const tokens = Array.from({ length: 501 }, (_, i) => `t${i}`);
    await service.sendToTokens(tokens, { title: 'T', body: 'B' });

    expect(send).toHaveBeenCalledTimes(2);
  });

  it('degrades gracefully when a whole batch throws', async () => {
    const send = fakeMessaging();
    send.mockRejectedValueOnce(new Error('network down'));
    const service = new PushService(configFrom(CONFIGURED));

    const result = await service.sendToTokens(['t1', 't2'], { title: 'T', body: 'B' });

    expect(result).toEqual({ successCount: 0, failureCount: 2, invalidTokens: [] });
  });
});

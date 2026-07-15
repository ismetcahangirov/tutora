import * as Sentry from '@sentry/react-native';

import { env } from '@/shared/config/env';

import { initSentry } from '../sentry';

// A shared, mutable env object (hoisted above the imports by Jest) lets each test
// drive the DSN without touching the real process environment.
jest.mock('@/shared/config/env', () => ({
  __esModule: true,
  env: { EXPO_PUBLIC_SENTRY_DSN: '', EXPO_PUBLIC_SENTRY_ENVIRONMENT: 'test' },
}));

const mockEnv = env as unknown as {
  EXPO_PUBLIC_SENTRY_DSN: string;
  EXPO_PUBLIC_SENTRY_ENVIRONMENT: string;
};

describe('initSentry', () => {
  afterEach(() => {
    mockEnv.EXPO_PUBLIC_SENTRY_DSN = '';
  });

  it('does not start the SDK when no DSN is configured', () => {
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts the SDK with the DSN and environment when configured', () => {
    mockEnv.EXPO_PUBLIC_SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@o0.ingest.sentry.io/1',
        environment: 'test',
      }),
    );
  });
});

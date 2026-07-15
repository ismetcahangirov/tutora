import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as Sentry from '@sentry/nextjs';
import { env } from '@shared/config/env';

import { initSentry } from '../sentry';

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  captureRequestError: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

vi.mock('@shared/config/env', () => ({
  env: { NEXT_PUBLIC_SENTRY_DSN: '', NEXT_PUBLIC_SENTRY_ENVIRONMENT: 'test' },
}));

const mockEnv = env as unknown as {
  NEXT_PUBLIC_SENTRY_DSN: string;
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: string;
};

describe('initSentry (web)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.NEXT_PUBLIC_SENTRY_DSN = '';
  });

  it('does not start the SDK when no DSN is configured', () => {
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts the SDK with the DSN and environment when configured', () => {
    mockEnv.NEXT_PUBLIC_SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@o0.ingest.sentry.io/1',
        environment: 'test',
      }),
    );
  });
});

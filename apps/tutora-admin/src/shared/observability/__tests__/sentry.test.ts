import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as Sentry from '@sentry/react';
import { env } from '@shared/config/env';

import { initSentry } from '../sentry';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  captureException: vi.fn(),
}));

vi.mock('@shared/config/env', () => ({
  env: { VITE_SENTRY_DSN: '', VITE_SENTRY_ENVIRONMENT: 'test' },
}));

const mockEnv = env as unknown as { VITE_SENTRY_DSN: string; VITE_SENTRY_ENVIRONMENT: string };

describe('initSentry (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.VITE_SENTRY_DSN = '';
  });

  it('does not start the SDK when no DSN is configured', () => {
    initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts the SDK with the DSN and environment when configured', () => {
    mockEnv.VITE_SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@o0.ingest.sentry.io/1',
        environment: 'test',
      }),
    );
  });
});

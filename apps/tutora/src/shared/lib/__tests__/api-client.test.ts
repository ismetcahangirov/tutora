/**
 * Shared Axios client + auto-refresh interceptors (issue #24).
 *
 * We drive the instance with a custom axios adapter so no real network happens:
 * the adapter branches on the request URL (and the bearer it carries) to
 * simulate an expired access token, the refresh endpoint, and the retried call.
 * This lets us assert the transparent 401 → refresh → retry behaviour, the
 * single-flight guarantee (critical: the backend rotates refresh tokens and
 * treats reuse as a compromise), and the fail-closed sign-out path.
 */
import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { apiClient, configureApiAuth, setAuthTokens } from '../api-client';

type RouteResult = { status: number; data: unknown };
type Router = (config: AxiosRequestConfig, bearer: string | null) => RouteResult;

let refreshCalls = 0;
let router: Router;

// A custom adapter bypasses axios's built-in `settle`, so we reproduce it here:
// non-2xx statuses reject with an AxiosError carrying `.response.status`, which
// is exactly what the client's response interceptor inspects.
function installAdapter() {
  apiClient.defaults.adapter = async (config): Promise<AxiosResponse> => {
    const bearer =
      (config.headers as { get?: (name: string) => unknown } | undefined)?.get?.('Authorization') ??
      null;
    const result = router(config, typeof bearer === 'string' ? bearer : null);
    const response: AxiosResponse = {
      data: result.data,
      status: result.status,
      statusText: '',
      headers: {},
      config: config as AxiosResponse['config'],
    };

    const isValid = config.validateStatus?.(result.status) ?? true;
    if (isValid) {
      return response;
    }
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
      config as AxiosResponse['config'],
      null,
      response,
    );
  };
}

beforeEach(() => {
  refreshCalls = 0;
  setAuthTokens({ accessToken: 'stale-access', refreshToken: 'refresh-1' });
  configureApiAuth({ onRefreshed: jest.fn(), onUnauthenticated: jest.fn() });
  installAdapter();
});

describe('api-client (#24)', () => {
  it('attaches the current access token as a Bearer header', async () => {
    let seen: string | null = null;
    router = (_config, bearer) => {
      seen = bearer;
      return { status: 200, data: { ok: true } };
    };

    await apiClient.get('/api/v1/users/me');

    expect(seen).toBe('Bearer stale-access');
  });

  it('transparently refreshes on 401, then retries with the new token', async () => {
    router = (config, bearer) => {
      if (config.url?.includes('/auth/refresh')) {
        refreshCalls += 1;
        return { status: 200, data: { accessToken: 'fresh-access', refreshToken: 'refresh-2' } };
      }
      return bearer === 'Bearer fresh-access'
        ? { status: 200, data: { id: 'u1' } }
        : { status: 401, data: { message: 'expired' } };
    };

    const response = await apiClient.get('/api/v1/users/me');

    expect(response.data).toEqual({ id: 'u1' });
    expect(refreshCalls).toBe(1);
  });

  it('persists the rotated pair via onRefreshed', async () => {
    const onRefreshed = jest.fn();
    configureApiAuth({ onRefreshed, onUnauthenticated: jest.fn() });
    router = (config, bearer) => {
      if (config.url?.includes('/auth/refresh')) {
        return { status: 200, data: { accessToken: 'fresh-access', refreshToken: 'refresh-2' } };
      }
      return bearer === 'Bearer fresh-access'
        ? { status: 200, data: { id: 'u1' } }
        : { status: 401, data: {} };
    };

    await apiClient.get('/api/v1/users/me');

    expect(onRefreshed).toHaveBeenCalledWith({
      accessToken: 'fresh-access',
      refreshToken: 'refresh-2',
    });
  });

  it('refreshes only once for concurrent 401s (single-flight)', async () => {
    router = (config, bearer) => {
      if (config.url?.includes('/auth/refresh')) {
        refreshCalls += 1;
        return { status: 200, data: { accessToken: 'fresh-access', refreshToken: 'refresh-2' } };
      }
      return bearer === 'Bearer fresh-access'
        ? { status: 200, data: { ok: true } }
        : { status: 401, data: {} };
    };

    await Promise.all([
      apiClient.get('/api/v1/users/me'),
      apiClient.get('/api/v1/tutors'),
      apiClient.get('/api/v1/reviews'),
    ]);

    expect(refreshCalls).toBe(1);
  });

  it('signs out (fail closed) when the refresh itself is rejected', async () => {
    const onUnauthenticated = jest.fn();
    configureApiAuth({ onRefreshed: jest.fn(), onUnauthenticated });
    router = (config) =>
      config.url?.includes('/auth/refresh')
        ? { status: 401, data: { message: 'reuse detected' } }
        : { status: 401, data: {} };

    await expect(apiClient.get('/api/v1/users/me')).rejects.toBeDefined();
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh for auth endpoints (avoids recursion)', async () => {
    router = (config) => {
      if (config.url?.includes('/auth/refresh')) {
        refreshCalls += 1;
        return { status: 200, data: {} };
      }
      return { status: 401, data: { message: 'invalid idToken' } };
    };

    await expect(apiClient.post('/api/v1/auth/google', { idToken: 'bad' })).rejects.toBeDefined();
    expect(refreshCalls).toBe(0);
  });

  it('does not refresh when there is no session', async () => {
    setAuthTokens(null);
    router = (config) => {
      if (config.url?.includes('/auth/refresh')) {
        refreshCalls += 1;
        return { status: 200, data: {} };
      }
      return { status: 401, data: {} };
    };

    await expect(apiClient.get('/api/v1/users/me')).rejects.toBeDefined();
    expect(refreshCalls).toBe(0);
  });
});

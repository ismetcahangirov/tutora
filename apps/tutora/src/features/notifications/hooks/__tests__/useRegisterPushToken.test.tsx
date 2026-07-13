/**
 * useRegisterPushToken (#50) — once authenticated it acquires a token and tells
 * the backend; disabled or token-less it stays quiet. The service + API are mocked.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { registerDevice } from '@features/notifications/api/notifications.api';
import {
  acquirePushRegistration,
  configureForegroundPresentation,
} from '@features/notifications/services/push-registration';

import { useRegisterPushToken } from '../useRegisterPushToken';

jest.mock('@features/notifications/services/push-registration', () => ({
  acquirePushRegistration: jest.fn(),
  configureForegroundPresentation: jest.fn(),
}));
jest.mock('@features/notifications/api/notifications.api', () => ({ registerDevice: jest.fn() }));

const mockedAcquire = acquirePushRegistration as jest.MockedFunction<
  typeof acquirePushRegistration
>;
const mockedConfigure = configureForegroundPresentation as jest.MockedFunction<
  typeof configureForegroundPresentation
>;
const mockedRegister = registerDevice as jest.MockedFunction<typeof registerDevice>;

describe('useRegisterPushToken (#50)', () => {
  it('registers the acquired token when authenticated', async () => {
    mockedAcquire.mockResolvedValueOnce({ token: 'tok', platform: 'IOS' });
    mockedRegister.mockResolvedValueOnce({
      id: 'd1',
      platform: 'IOS',
      lastUsedAt: '2026-07-13T10:00:00.000Z',
      createdAt: '2026-07-13T10:00:00.000Z',
    });

    await renderHook(() => useRegisterPushToken(true));

    await waitFor(() =>
      expect(mockedRegister).toHaveBeenCalledWith({ token: 'tok', platform: 'IOS' }),
    );
    expect(mockedConfigure).toHaveBeenCalled();
  });

  it('does nothing when not authenticated', async () => {
    await renderHook(() => useRegisterPushToken(false));

    await act(async () => {});
    expect(mockedAcquire).not.toHaveBeenCalled();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('does not register when no token could be acquired', async () => {
    mockedAcquire.mockResolvedValueOnce(null);

    await renderHook(() => useRegisterPushToken(true));

    await act(async () => {});
    expect(mockedRegister).not.toHaveBeenCalled();
  });
});

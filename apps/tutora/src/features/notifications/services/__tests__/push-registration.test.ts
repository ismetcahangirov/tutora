/**
 * Push registration service (#50) — platform mapping + the acquire flow, which
 * must fail soft (return null) whenever the device can't receive push. The native
 * modules are stubbed globally in jest-setup; here we drive their return values.
 */
import * as Notifications from 'expo-notifications';

import { acquirePushRegistration, resolveDevicePlatform } from '../push-registration';

// A live getter so toggling `mockIsDevice` is visible through the service's
// interop-copied namespace (a plain value would be captured once at import).
let mockIsDevice = true;
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice;
  },
}));

const mockedGetPermissions = jest.mocked(Notifications.getPermissionsAsync);
const mockedRequestPermissions = jest.mocked(Notifications.requestPermissionsAsync);
const mockedGetToken = jest.mocked(Notifications.getDevicePushTokenAsync);

beforeEach(() => {
  mockIsDevice = true;
});

describe('resolveDevicePlatform', () => {
  it('maps the RN platform to the backend enum', () => {
    expect(resolveDevicePlatform('ios')).toBe('IOS');
    expect(resolveDevicePlatform('android')).toBe('ANDROID');
    expect(resolveDevicePlatform('web')).toBe('WEB');
  });

  it('returns null for an unsupported platform', () => {
    expect(resolveDevicePlatform('windows' as 'ios')).toBeNull();
  });
});

describe('acquirePushRegistration', () => {
  it('returns the token + platform when permission is already granted', async () => {
    mockedGetToken.mockResolvedValueOnce({ type: 'ios', data: 'apns-token' });

    // jest-expo defaults Platform.OS to "ios".
    await expect(acquirePushRegistration()).resolves.toEqual({
      token: 'apns-token',
      platform: 'IOS',
    });
  });

  it('requests permission when not yet granted', async () => {
    mockedGetPermissions.mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);

    await acquirePushRegistration();
    expect(mockedRequestPermissions).toHaveBeenCalled();
  });

  it('returns null when permission is denied and cannot be re-asked', async () => {
    mockedGetPermissions.mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
      status: 'denied',
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);

    await expect(acquirePushRegistration()).resolves.toBeNull();
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
  });

  it('returns null on a simulator (no physical device)', async () => {
    mockIsDevice = false;

    await expect(acquirePushRegistration()).resolves.toBeNull();
    expect(mockedGetToken).not.toHaveBeenCalled();
  });

  it('never throws — a native failure resolves to null', async () => {
    mockedGetToken.mockRejectedValueOnce(new Error('no google-services.json'));

    await expect(acquirePushRegistration()).resolves.toBeNull();
  });
});

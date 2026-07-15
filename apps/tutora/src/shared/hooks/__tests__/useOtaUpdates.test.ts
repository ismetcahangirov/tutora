import { renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useOtaUpdates } from '../useOtaUpdates';

// `isEnabled` is a getter over the factory's own closure, and `__setEnabled`
// mutates that same closure — so however the import interop copies the module,
// both the hook and this test read one shared flag.
jest.mock('expo-updates', () => {
  let enabled = false;
  return {
    __esModule: true,
    get isEnabled() {
      return enabled;
    },
    __setEnabled: (value: boolean) => {
      enabled = value;
    },
    checkForUpdateAsync: jest.fn(async () => ({ isAvailable: false })),
    fetchUpdateAsync: jest.fn(async () => ({ isNew: true })),
    reloadAsync: jest.fn(async () => undefined),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const updates = require('expo-updates') as {
  __setEnabled: (value: boolean) => void;
  checkForUpdateAsync: jest.Mock;
  fetchUpdateAsync: jest.Mock;
  reloadAsync: jest.Mock;
};

describe('useOtaUpdates', () => {
  let changeHandler: ((state: string) => void) | undefined;

  beforeEach(() => {
    updates.__setEnabled(true);
    changeHandler = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'change') changeHandler = handler as (state: string) => void;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches and reloads when an update is available on foreground', async () => {
    updates.checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: true });
    renderHook(() => useOtaUpdates());
    // The subscription effect flushes asynchronously — wait for it to register.
    await waitFor(() => expect(changeHandler).toBeDefined());

    changeHandler?.('active');

    await waitFor(() => expect(updates.reloadAsync).toHaveBeenCalledTimes(1));
    expect(updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no update is available', async () => {
    updates.checkForUpdateAsync.mockResolvedValueOnce({ isAvailable: false });
    renderHook(() => useOtaUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());

    changeHandler?.('active');

    await waitFor(() => expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(1));
    expect(updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('stays inert when updates are disabled (dev / Expo Go)', () => {
    updates.__setEnabled(false);
    renderHook(() => useOtaUpdates());

    changeHandler?.('active');

    expect(updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });
});

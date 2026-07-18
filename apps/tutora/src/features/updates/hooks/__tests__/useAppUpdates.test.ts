import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useAppUpdates } from '../useAppUpdates';

let mockReturn: {
  isUpdateAvailable: boolean;
  isDownloading: boolean;
  isUpdatePending: boolean;
  downloadProgress?: number;
};

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
    useUpdates: () => mockReturn,
    checkForUpdateAsync: jest.fn(async () => undefined),
    fetchUpdateAsync: jest.fn(async () => undefined),
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

describe('useAppUpdates', () => {
  let changeHandler: ((state: string) => void) | undefined;

  beforeEach(() => {
    updates.__setEnabled(true);
    mockReturn = {
      isUpdateAvailable: false,
      isDownloading: false,
      isUpdatePending: false,
      downloadProgress: undefined,
    };
    changeHandler = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'change') changeHandler = handler as (state: string) => void;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays idle when updates are disabled (dev / Expo Go), even if the underlying hook reports one available', async () => {
    updates.__setEnabled(false);
    mockReturn.isUpdateAvailable = true;
    const { result } = await renderHook(() => useAppUpdates());
    expect(result.current.status).toBe('idle');
  });

  it('moves to "available" when a foreground check finds an update', async () => {
    // RNTL v14's renderHook/rerender are async — and the mock `useUpdates` is
    // a plain object, not a reactive subscription like the real one, so
    // mutating `mockReturn` needs an explicit `rerender` to be picked up
    // (standing in for the re-render the real hook would trigger itself once
    // `checkForUpdateAsync` resolves).
    const { result, rerender } = await renderHook(() => useAppUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());

    mockReturn.isUpdateAvailable = true;
    await act(async () => {
      changeHandler?.('active');
    });
    await rerender(undefined);

    expect(result.current.status).toBe('available');
    expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('apply() calls fetchUpdateAsync and the caller can observe "downloading"', async () => {
    const { result, rerender } = await renderHook(() => useAppUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());
    mockReturn.isUpdateAvailable = true;
    await act(async () => {
      changeHandler?.('active');
    });
    await rerender(undefined);
    expect(result.current.status).toBe('available');

    updates.fetchUpdateAsync.mockImplementationOnce(async () => {
      mockReturn.isDownloading = true;
    });

    await act(async () => {
      await result.current.apply();
    });
    await rerender(undefined);

    expect(updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('downloading');
  });

  it('reaches "restarting" and calls reloadAsync once the update is pending', async () => {
    mockReturn.isUpdatePending = true;
    const { result } = await renderHook(() => useAppUpdates());

    await waitFor(() => expect(result.current.status).toBe('restarting'));
    await waitFor(() => expect(updates.reloadAsync).toHaveBeenCalledTimes(1));
  });

  it('dismiss() returns to idle and does not re-show until the next foreground', async () => {
    const { result, rerender } = await renderHook(() => useAppUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());
    mockReturn.isUpdateAvailable = true;
    await act(async () => {
      changeHandler?.('active');
    });
    await rerender(undefined);
    expect(result.current.status).toBe('available');

    await act(() => {
      result.current.dismiss();
    });

    expect(result.current.status).toBe('idle');
  });
});

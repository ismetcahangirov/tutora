/**
 * appearance storage (#49) — round-trips the theme preference and defends against
 * a corrupt stored value (falling back to "unset" so the provider uses its
 * default). MMKV is stubbed by the global jest setup with a shared in-memory map.
 */
import { createMMKV } from 'react-native-mmkv';

import { getStoredAppearance, setStoredAppearance } from '../appearance-storage';

/** The jest MMKV stub (see jest-setup) exposes set/getString/delete on one map. */
type MmkvStub = {
  set: (key: string, value: string) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
};

const storage = createMMKV({ id: 'tutora' }) as unknown as MmkvStub;
const APPEARANCE_KEY = 'settings.appearance';

beforeEach(() => storage.delete(APPEARANCE_KEY));

describe('appearance storage (#49)', () => {
  it('returns undefined when nothing is stored', () => {
    expect(getStoredAppearance()).toBeUndefined();
  });

  it('round-trips a valid preference', () => {
    setStoredAppearance('dark');
    expect(getStoredAppearance()).toBe('dark');

    setStoredAppearance('system');
    expect(getStoredAppearance()).toBe('system');
  });

  it('ignores a corrupt stored value', () => {
    storage.set(APPEARANCE_KEY, 'chartreuse');
    expect(getStoredAppearance()).toBeUndefined();
  });
});

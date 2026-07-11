/**
 * Theme resolution + dark mode (issue #16).
 */
import { act, renderHook } from '@testing-library/react-native';

import { renderHookWithProviders } from '@/test-utils';
import { useTheme, useThemeMode } from '@/theme';

describe('ThemeProvider (#16)', () => {
  it('resolves the light palette by default preference', async () => {
    const { result } = await renderHookWithProviders(() => useTheme(), { preference: 'light' });
    expect(result.current.mode).toBe('light');
    expect(result.current.colors.background).toBe('#FFFFFF');
  });

  it('honors a forced dark preference', async () => {
    const { result } = await renderHookWithProviders(() => useTheme(), { preference: 'dark' });
    expect(result.current.mode).toBe('dark');
    expect(result.current.colors.background).toBe('#0B1120');
  });

  it('toggles between light and dark', async () => {
    const { result } = await renderHookWithProviders(() => useThemeMode(), { preference: 'light' });

    expect(result.current.mode).toBe('light');
    await act(async () => result.current.toggle());
    expect(result.current.mode).toBe('dark');
    expect(result.current.preference).toBe('dark');
  });

  it('throws when used outside a provider', async () => {
    // Suppress the expected React error log for readability.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useTheme())).rejects.toThrow('useTheme must be used within');
    spy.mockRestore();
  });
});

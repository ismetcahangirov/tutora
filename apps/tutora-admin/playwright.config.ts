import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for the admin panel (issue #98).
 *
 * The suite runs against the production build served by `vite preview`, so it
 * exercises the real bundle and the SPA history fallback. It deliberately covers
 * only journeys that need no backend — the auth guard, the public sign-in screen,
 * i18n, and theming — since the admin API is out of scope for this suite. The
 * context locale is pinned so i18next's navigator detection is deterministic.
 */
const PORT = Number(process.env.PLAYWRIGHT_ADMIN_PORT ?? 4173);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: './e2e/.report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL,
    locale: 'en-US',
    // Pin light so the "no dark class yet" assertion is deterministic before the
    // theme toggle runs (default mode is `system`).
    colorScheme: 'light',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm run build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

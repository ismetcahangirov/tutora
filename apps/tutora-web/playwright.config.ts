import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for the landing site (issue #98).
 *
 * The suite runs against the Next dev server. The behaviour it asserts — locale
 * routing, SEO metadata, structured data, robots/sitemap — is identical in dev
 * and prod, while `output: 'standalone'` makes `next start` awkward to serve
 * standalone; the production build itself is already gated by the CI `build`
 * job. In CI the browsers are provided by the e2e workflow; locally,
 * `pnpm exec playwright install chromium` installs them once.
 */
const PORT = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Keep artifacts out of the app source tree and the Next build.
  outputDir: './e2e/.results',
  fullyParallel: true,
  // Fail the build if a `.only` is committed.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: './e2e/.report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL,
    // Capture a trace on the first retry so CI failures are debuggable.
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm run dev',
    // `/en` is a concrete 200; `/` is a locale-negotiated redirect.
    url: `${baseURL}/en`,
    reuseExistingServer: !process.env.CI,
    // The dev server compiles routes on first hit, so allow a generous boot.
    timeout: 180_000,
    env: { PORT: String(PORT) },
  },
});

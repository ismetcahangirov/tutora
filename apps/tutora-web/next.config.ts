import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

// In a pnpm monorepo, standalone tracing must start at the repo root so hoisted
// workspace dependencies are included in the output bundle.
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const nextConfig: NextConfig = {
  // Emit a self-contained server (+ traced node_modules) for the Docker image.
  output: 'standalone',
  outputFileTracingRoot: rootDir,
};

// Sentry build-time integration (issue #92). Source-map upload only runs when
// SENTRY_ORG/SENTRY_PROJECT and a SENTRY_AUTH_TOKEN are present (e.g. in the
// deploy pipeline); otherwise the build proceeds untouched. Runtime error
// reporting is wired in instrumentation*.ts and is fail-soft on its own.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only print source-map upload logs in CI to keep local builds quiet.
  silent: !process.env.CI,
});

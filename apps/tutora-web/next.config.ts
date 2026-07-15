import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

export default withNextIntl(nextConfig);

/**
 * Jest configuration for the Tutora mobile app.
 *
 * Uses the `jest-expo` preset (which resolves Expo's Babel preset automatically
 * without a project `babel.config.js`). The `transformIgnorePatterns` override is
 * pnpm-aware: pnpm nests packages under `node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>`,
 * so the default RN pattern does not match. The optional `.pnpm/…/node_modules/`
 * segment lets us whitelist RN/Expo packages regardless of hoisting layout.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  clearMocks: true,
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:jest-)?(@react-native|@react-navigation|@expo|@gorhom|@shopify|react-native|react-navigation|expo|unimodules|sentry-expo|native-base))',
  ],
};

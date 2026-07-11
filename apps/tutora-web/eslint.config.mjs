import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import houseRules from '@tutora/config/eslint/rules';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Shared house rules last so they win (e.g. no-explicit-any: error).
  ...houseRules,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;

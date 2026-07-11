/**
 * Shared "house" ESLint rules, appended to each app's framework flat config.
 *
 * These objects register NO plugins of their own, so they compose without the
 * flat-config "plugin already defined" collisions you get when layering presets.
 * The TypeScript rule is scoped to TS files, where the framework preset has
 * already registered the `@typescript-eslint` plugin.
 *
 * Consumed as: `...require('@tutora/config/eslint/rules')` at the end of a
 * flat config array.
 */
module.exports = [
  {
    name: '@tutora/config/house-core',
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
    },
  },
  {
    name: '@tutora/config/house-typescript',
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];

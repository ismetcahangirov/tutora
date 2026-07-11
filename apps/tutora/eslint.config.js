// Expo flat ESLint config. https://docs.expo.dev/guides/using-eslint/
// Kept explicit (instead of `expo lint`) so linting never triggers a runtime
// dependency install in CI. The shared workspace ESLint config is layered on
// top in sub-issue #3.
const expoConfig = require('eslint-config-expo/flat');
const houseRules = require('@tutora/config/eslint/rules');

module.exports = [
  expoConfig,
  ...houseRules,
  // Node/CLI dev scripts legitimately use console.
  { ignores: ['dist/*', '.expo/*', 'scripts/*'] },
].flat();

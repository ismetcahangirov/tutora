// ESLint flat config resolves from the CWD, not per-file, and each app owns its
// own config + eslint install. So we group staged app files by their workspace
// package and run ESLint inside each via `pnpm --filter … exec` (lint-staged
// passes absolute paths, which resolve correctly from the app CWD). Prettier is
// a root dependency and runs from the root for everything.
const DIR_TO_PKG = {
  'apps/tutora-api': '@tutora/api',
  'apps/tutora-admin': '@tutora/admin',
  'apps/tutora-web': '@tutora/web',
  // Keep the bare mobile app last: 'apps/tutora' is a prefix of the others.
  'apps/tutora': '@tutora/mobile',
};

const quote = (file) => `"${file}"`;

/** ESLint --fix each staged app file, grouped by its owning package. */
function eslintByApp(files) {
  const normalized = files.map((file) => file.replace(/\\/g, '/'));
  const commands = [];
  for (const [dir, pkg] of Object.entries(DIR_TO_PKG)) {
    const group = normalized.filter((file) => file.includes(`/${dir}/`));
    if (group.length > 0) {
      commands.push(
        `pnpm --filter ${pkg} exec eslint --fix --no-warn-ignored ${group.map(quote).join(' ')}`,
      );
    }
  }
  return commands;
}

export default {
  'apps/**/*.{ts,tsx,js,jsx,mjs,cjs}': (files) => [
    ...eslintByApp(files),
    `prettier --write ${files.map(quote).join(' ')}`,
  ],
  'packages/**/*.{ts,tsx,js,jsx,mjs,cjs}': (files) => [
    `prettier --write ${files.map(quote).join(' ')}`,
  ],
  '*.{json,md,yml,yaml}': (files) => [`prettier --write ${files.map(quote).join(' ')}`],
};

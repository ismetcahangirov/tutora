import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guards the shared configuration this package exports. It is the single source
 * of truth for Prettier, the house ESLint rules and the strict tsconfig base —
 * a malformed file here silently breaks tooling in every workspace package, so
 * a fast smoke test keeps the contract honest (#95).
 */

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Parses a JSONC file, dropping whole-line `//` comments (used by tsconfig bases). */
function readJsonc(relPath: string): Record<string, unknown> {
  const raw = readFileSync(join(here, relPath), 'utf8');
  const stripped = raw
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  return JSON.parse(stripped) as Record<string, unknown>;
}

describe('@tutora/config', () => {
  it('exposes a valid Prettier config matching the house style', () => {
    const prettier = readJsonc('prettier/index.json');
    expect(prettier).toMatchObject({
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      endOfLine: 'lf',
    });
  });

  it('exposes a strict tsconfig base', () => {
    const tsconfig = readJsonc('tsconfig/base.json');
    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.strict).toBe(true);
    expect(compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(compilerOptions.resolveJsonModule).toBe(true);
  });

  it('exposes composable house ESLint rules that register no plugins', () => {
    const rules = require('./eslint/rules.cjs') as { name?: string; plugins?: unknown }[];
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    for (const block of rules) {
      // Every block is named (readable flat-config) and pulls in no plugin of
      // its own, so consumers can spread these without "plugin already defined".
      expect(typeof block.name).toBe('string');
      expect(block.plugins).toBeUndefined();
    }
  });

  it('resolves every path in the package export map', () => {
    const pkg = readJsonc('package.json');
    const exportsMap = pkg.exports as Record<string, string>;
    for (const target of Object.values(exportsMap)) {
      expect(existsSync(join(here, target)), `missing export target: ${target}`).toBe(true);
    }
  });
});

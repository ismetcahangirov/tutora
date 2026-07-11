# Scaffold Monorepo (Epic #1 · Sub-issue #2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> This is infrastructure/scaffolding work: the TDD "failing test → pass" rhythm is
> replaced by "run command → verify install/typecheck/lint succeeds".

**Goal:** Stand up a pnpm + Turborepo monorepo containing the four Tutora apps
(mobile, api, admin, web), each scaffolded with its official CLI, wired into the
workspace, and carrying a feature-first folder skeleton and standard scripts.

**Architecture:** Single private root workspace with `apps/*` and `packages/*` globs.
Turborepo orchestrates `build`/`lint`/`typecheck`/`test`. pnpm is activated via
corepack and pinned in `packageManager`. `.npmrc` uses `node-linker=hoisted` so the
React Native / Metro bundler tolerates the dependency layout.

**Tech Stack:** pnpm workspaces, Turborepo, TypeScript (strict base), Expo (RN),
NestJS, Vite (React), Next.js (App Router), Node 22.

**Scope note:** Sub-issues #3–#7 (lint/format config, git hooks, path aliases, Zod
env validation, Docker Compose) get their own plans on their own stacked branches.
This plan is only #2.

---

## File Structure

**Root (created this plan):**
- `pnpm-workspace.yaml` — workspace globs
- `.npmrc` — pnpm settings (`node-linker=hoisted`, `auto-install-peers=true`)
- `turbo.json` — task pipeline
- `package.json` — private root; scripts delegate to turbo; `packageManager` pinned
- `tsconfig.base.json` — minimal strict base apps extend (finalized in #3)
- `.nvmrc` — `22`

**Apps (scaffolded, then integrated):**
- `apps/tutora/` — `@tutora/mobile` (Expo + expo-router)
- `apps/tutora-api/` — `@tutora/api` (NestJS, strict)
- `apps/tutora-admin/` — `@tutora/admin` (Vite react-ts)
- `apps/tutora-web/` — `@tutora/web` (Next.js App Router, `@/*` alias)

**Feature-first skeleton (`.gitkeep` placeholders):**
- mobile/admin/web: `src/features/`, `src/shared/{components,hooks,lib,types,utils,constants}`
- api: `src/modules/`, `src/common/{decorators,filters,guards,interceptors,pipes,utils}`, `src/config/`

---

## Task 1: Root workspace skeleton

**Files:** Create `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`, `tsconfig.base.json`,
`turbo.json`, `package.json` (root).

- [ ] **Step 1: Activate pnpm via corepack and capture version**

Run: `corepack prepare pnpm@latest --activate && pnpm -v`
Expected: prints a pnpm version (e.g. `9.x.x` / `10.x.x`). Record it for `packageManager`.

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 3: Write `.npmrc`**

```ini
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 4: Write `.nvmrc`**

```
22
```

- [ ] **Step 5: Write `tsconfig.base.json`** (minimal strict base; #3 enriches)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  }
}
```

- [ ] **Step 6: Write root `package.json`** (pin `packageManager` to the version from Step 1)

```json
{
  "name": "tutora",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@<version-from-step-1>",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
  },
  "devDependencies": {
    "prettier": "^3.3.3",
    "turbo": "^2.1.0",
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 7: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

- [ ] **Step 8: Install root dev deps and verify**

Run: `pnpm install`
Expected: resolves and installs turbo/prettier/typescript with no error.

- [ ] **Step 9: Commit**

```bash
git add pnpm-workspace.yaml .npmrc .nvmrc tsconfig.base.json turbo.json package.json pnpm-lock.yaml
git commit -m "chore(setup): add pnpm + turborepo workspace root (refs #2)"
```

---

## Task 2: Scaffold the four apps (files only, no per-app install)

**Files:** Create `apps/tutora`, `apps/tutora-api`, `apps/tutora-admin`, `apps/tutora-web`.

Each scaffolder runs non-interactively and skips install (we install once at root).
If any scaffolder still prompts interactively, stop and hand the command to the user
via the `!` prefix.

- [ ] **Step 1: Mobile (Expo + expo-router)**

Run: `pnpm create expo-app apps/tutora --template default --yes`
Expected: `apps/tutora` created with TypeScript + expo-router example.
Note: if it auto-installs, that is acceptable; nested lockfile is removed in Task 3.

- [ ] **Step 2: API (NestJS, strict)**

Run: `pnpm dlx @nestjs/cli@latest new apps/tutora-api --skip-install --skip-git --package-manager pnpm --strict`
Expected: `apps/tutora-api` created with strict TS.

- [ ] **Step 3: Admin (Vite react-ts)**

Run: `pnpm create vite@latest apps/tutora-admin --template react-ts`
Expected: `apps/tutora-admin` scaffolded (create-vite writes files only, no install).

- [ ] **Step 4: Web (Next.js App Router)**

Run: `pnpm create next-app@latest apps/tutora-web --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-pnpm --skip-install --yes`
Expected: `apps/tutora-web` created with App Router + `@/*` alias.

- [ ] **Step 5: Verify all four app directories exist**

Run: `ls apps`
Expected: `tutora  tutora-admin  tutora-api  tutora-web`

- [ ] **Step 6: Commit raw scaffolds**

```bash
git add apps
git commit -m "chore(setup): scaffold mobile/api/admin/web via official CLIs (refs #2)"
```

---

## Task 3: Integrate scaffolds into the workspace

**Files:** Modify each `apps/*/package.json`; delete nested lockfiles / `.git`.

- [ ] **Step 1: Remove nested VCS and lockfiles**

Run:
```bash
rm -rf apps/*/.git
rm -f apps/*/package-lock.json apps/*/pnpm-lock.yaml apps/*/yarn.lock
```
Expected: no nested `.git` or lockfiles remain under `apps/*`.

- [ ] **Step 2: Rename each app package**

Edit `name` field:
- `apps/tutora/package.json` → `"@tutora/mobile"`
- `apps/tutora-api/package.json` → `"@tutora/api"`
- `apps/tutora-admin/package.json` → `"@tutora/admin"`
- `apps/tutora-web/package.json` → `"@tutora/web"`

- [ ] **Step 3: Ensure standard scripts on every app**

Each `apps/*/package.json` must expose `dev`, `build`, `lint`, `typecheck`, `test`.
Add any missing ones:
- Add `"typecheck": "tsc --noEmit"` where absent (all four).
- Vite admin: add `"lint"` if missing (`eslint .`), and a placeholder
  `"test": "echo \"no tests yet\" && exit 0"` until #-testing lands.
- Next web: `build`/`lint` exist; add `typecheck` and a `test` placeholder.
- Nest api: `build`/`lint`/`test` exist; ensure `typecheck` present.
- Expo mobile: add `"typecheck": "tsc --noEmit"`, `"lint": "expo lint"` (or eslint),
  and a `test` placeholder.

- [ ] **Step 4: Point each app tsconfig at the base (extends)**

For each app `tsconfig.json`, add `"extends": "../../tsconfig.base.json"` while keeping
the app-specific compilerOptions the scaffolder generated (JSX, moduleResolution, etc.).
Do not remove scaffolder settings needed by the bundler — layer on top.

- [ ] **Step 5: Install the whole workspace**

Run: `pnpm install`
Expected: single root `pnpm-lock.yaml`; all four apps resolve; no error.

- [ ] **Step 6: Commit integration**

```bash
git add apps pnpm-lock.yaml
git commit -m "chore(setup): integrate apps into pnpm workspace (rename, scripts, tsconfig) (refs #2)"
```

---

## Task 4: Feature-first folder skeleton

**Files:** Create `.gitkeep` placeholders under each app's feature-first tree.

- [ ] **Step 1: Create skeleton directories**

Run:
```bash
# mobile / admin / web (React apps)
for app in tutora tutora-admin tutora-web; do
  mkdir -p "apps/$app/src/features"
  mkdir -p "apps/$app/src/shared/components" "apps/$app/src/shared/hooks" \
           "apps/$app/src/shared/lib" "apps/$app/src/shared/types" \
           "apps/$app/src/shared/utils" "apps/$app/src/shared/constants"
done
# api (NestJS)
mkdir -p apps/tutora-api/src/modules
mkdir -p apps/tutora-api/src/common/decorators apps/tutora-api/src/common/filters \
         apps/tutora-api/src/common/guards apps/tutora-api/src/common/interceptors \
         apps/tutora-api/src/common/pipes apps/tutora-api/src/common/utils
mkdir -p apps/tutora-api/src/config
# keep empty dirs in git
find apps/*/src/features apps/*/src/shared apps/tutora-api/src/modules \
     apps/tutora-api/src/common apps/tutora-api/src/config -type d -empty \
     -exec touch {}/.gitkeep \;
```
Expected: `.gitkeep` files created in each empty leaf directory.

- [ ] **Step 2: Commit skeleton**

```bash
git add apps
git commit -m "chore(setup): add feature-first folder skeleton to all apps (refs #2)"
```

---

## Task 5: Verify the workspace end-to-end

- [ ] **Step 1: Typecheck across the workspace**

Run: `pnpm -w typecheck`
Expected: turbo runs `typecheck` in each app; all pass (scaffolds are type-clean).
If an app has no `typecheck`, Task 3 Step 3 missed it — fix and re-run.

- [ ] **Step 2: Lint across the workspace**

Run: `pnpm -w lint`
Expected: turbo runs `lint`; passes (scaffold defaults are lint-clean). Record any
failures for the #3 tooling pass rather than disabling rules here.

- [ ] **Step 3: Build across the workspace**

Run: `pnpm -w build`
Expected: api/admin/web build; mobile `build` may be a no-op/export — acceptable as
long as it exits 0. Fix any real error.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore(setup): make workspace typecheck/lint/build green (refs #2)"
```

---

## Task 6: Open Draft PR

- [ ] **Step 1: Push branch**

Run: `git push -u origin chore/scaffold-monorepo`

- [ ] **Step 2: Open Draft PR against main**

Run:
```bash
gh pr create --draft --base main --title "chore: scaffold pnpm + turborepo monorepo (#2)" \
  --body "Closes #2. Part of #1. pnpm workspaces + Turborepo; mobile/api/admin/web scaffolded via official CLIs; feature-first skeleton; workspace typecheck/lint/build green."
```
Expected: PR URL printed.

---

## Self-Review

- **Spec coverage:** #2 requirements (four packages, feature-first structure, base
  configs, package.json scripts) → Tasks 1–5. ✅
- **Placeholders:** `<version-from-step-1>` is an intentional runtime value, resolved
  in Task 1 Step 1. No other placeholders.
- **Type consistency:** package names `@tutora/{mobile,api,admin,web}` used
  consistently; `tsconfig.base.json` referenced identically everywhere.
- **Known reactive risks:** interactive scaffolder prompts (mitigate with `--yes`/
  flags or `!`), pnpm+Metro symlink issues (mitigated by `node-linker=hoisted`),
  scaffolder-emitted `any`/lint noise (defer to #3, don't blanket-disable).

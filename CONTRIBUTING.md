# Contributing to Tutora

Thanks for contributing! This guide covers how to set up, branch, commit, and open
pull requests. It complements the binding engineering standards in
[`CLAUDE.md`](CLAUDE.md) and the deep-dive conventions in
[`.claude/context/`](.claude/context). Where this guide and those documents differ
on _process_, this guide reflects what the repository actually does today.

## Table of contents

- [Getting set up](#getting-set-up)
- [Branching](#branching)
- [Commits](#commits)
- [Local quality gates](#local-quality-gates)
- [Opening a pull request](#opening-a-pull-request)
- [Definition of Done](#definition-of-done)
- [Labels](#labels)
- [Windows notes](#windows-notes)

---

## Getting set up

Follow the [Developer Onboarding guide](docs/onboarding.md) to go from clone to a
running stack. In short: this is a pnpm + Turborepo monorepo, so `pnpm install`
at the root sets up every workspace under `apps/*` and `packages/*`.

---

## Branching

`main` is the default, **protected** branch. Do not push to it directly — every
change lands through a reviewed, squash-merged pull request. Branch from an
up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b <type>/<short-kebab-description>
```

Use a prefix that matches the change:

| Prefix      | For                           | Example                              |
| ----------- | ----------------------------- | ------------------------------------ |
| `feature/`  | New user-facing functionality | `feature/search-district-filter`     |
| `bugfix/`   | Bug fix                       | `bugfix/refresh-token-race`          |
| `hotfix/`   | Critical production fix       | `hotfix/login-crash-ios`             |
| `refactor/` | Internal code improvement     | `refactor/extract-availability-hook` |
| `docs/`     | Documentation only            | `docs/onboarding-guide`              |
| `test/`     | Tests only                    | `test/mobile-e2e-maestro`            |
| `ci/`       | CI/CD config only             | `ci/add-e2e-workflow`                |
| `chore/`    | Maintenance (deps, tooling)   | `chore/upgrade-expo-sdk`             |
| `style/`    | Formatting / visual only      | `style/unify-card-radius`            |

Rules: lowercase, hyphen-separated, no underscores or spaces, ≤ 60 characters.
Keep one branch per task and delete it after merge. The full branch model
(including the documented `develop` integration branch) lives in
[`.claude/context/git-workflow.md`](.claude/context/git-workflow.md).

---

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and
are linted by commitlint (`@commitlint/config-conventional`) via a `commit-msg`
hook.

```
<type>(<scope>): <imperative description>
```

- **Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `build`, `ci`,
  `perf`, `chore`.
- **Scope** is the feature or module in kebab-case: `auth`, `search`,
  `tutor-profile`, `chat`, `api-users`, `admin`, …
- The **subject must start lowercase** and use the imperative mood
  (`add …`, not `Added …` / `Adds …`). commitlint rejects sentence-case subjects.

```
feat(search): add district filter to the tutor query
fix(chat): resolve message ordering on slow connections
docs(architecture): record the monorepo tooling decision
```

Commit in small, working increments. Breaking changes use a `!` and a
`BREAKING CHANGE:` footer.

---

## Local quality gates

Husky runs hooks automatically:

- **`pre-commit`** → `lint-staged`: ESLint (`--fix`) on staged app files, Prettier
  on everything staged.
- **`commit-msg`** → commitlint on your message.
- **`pre-push`** → `pnpm typecheck && pnpm lint` across the monorepo.

Run the same checks CI enforces before you push:

```bash
pnpm typecheck      # tsc --noEmit everywhere
pnpm lint           # ESLint everywhere
pnpm test           # unit tests everywhere
pnpm format:check   # Prettier check (CI runs this)
pnpm build          # production build of every app
```

Scope to one workspace with `--filter`, e.g. `pnpm --filter @tutora/api test`.

---

## Opening a pull request

1. **Open a Draft PR early** and target `main`.
2. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md): summary, changes,
   test plan, and the checklist.
3. Link the issue you're closing (`Closes #123`). Keep PRs **small and focused** —
   one concern per PR.
4. Ensure CI is green. The pipelines:
   - **CI** (`.github/workflows/ci.yml`): Prettier check + commitlint, then a
     matrix of `lint`, `typecheck`, `test`, `build`.
   - **E2E** (`.github/workflows/e2e.yml`): Playwright (web/admin) + the API
     Supertest suite. Mobile E2E (Maestro) is a separate, opt-in workflow.
5. Request review — [`CODEOWNERS`](.github/CODEOWNERS) is applied automatically.
   At least **one approval** is required; address all review comments with new
   commits (avoid force-pushing mid-review).
6. **Squash-merge** after approval, then **delete the branch**.

---

## Definition of Done

A change is _Done_ only when (see [`CLAUDE.md`](CLAUDE.md) for the full list):

- [ ] Meets the acceptance criteria and product intent.
- [ ] Strongly typed; `typecheck` passes with no errors.
- [ ] `lint` and `format:check` pass with no new warnings.
- [ ] Unit/integration tests added and passing; **bug fixes ship with a
      regression test**.
- [ ] UI handles loading / empty / error / success and is accessible &
      dark-mode ready.
- [ ] No hardcoded strings (use i18n), no magic numbers (use tokens/constants),
      no gradients.
- [ ] Secure: input validated, authorization enforced, no secrets, safe logging.
- [ ] Self-reviewed; no dead or duplicated code; docs updated where relevant.
- [ ] Conventional Commit + PR template followed; CI green; approved.

---

## Labels

Issues and PRs are triaged with labels for **type** (`feature`, `bug`,
`documentation`, `refactor`, `testing`, …), **area** (`area: mobile`,
`area: backend`, `area: frontend`, `area: api`, …), and **priority**
(`priority: high | medium | low`). The canonical set lives in
[`.github/labels.json`](.github/labels.json) and can be synced with:

```bash
bash scripts/setup-labels.sh     # macOS / Linux
pwsh scripts/setup-labels.ps1    # Windows
```

---

## Windows notes

- Install pnpm with `npm install -g pnpm@11.11.0` if `corepack enable` fails with
  an `EPERM` symlink error, and start Docker Desktop manually.
- The Turborepo `pre-push` hook can be flaky on Windows. Run
  `pnpm typecheck && pnpm lint` yourself and push with `git push --no-verify`
  once they're green.

See [`docs/onboarding.md`](docs/onboarding.md#troubleshooting) for more
troubleshooting.

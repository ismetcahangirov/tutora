# Tutora — Git Workflow

## Branch Strategy

Tutora uses a **trunk-based development** variant with two long-lived branches and short-lived feature branches.

```
main        ← production-ready code; deployed to production
  └── develop   ← integration branch; all features merge here first
        ├── feature/...
        ├── bugfix/...
        ├── hotfix/...
        └── ...
```

### Protected Branches

| Branch | Protection Rules |
|---|---|
| `main` | Require PR. Require 1 approval. No direct push. No force push. CI must pass. |
| `develop` | Require PR. Require 1 approval. No direct push. CI must pass. |

**Hotfixes** targeting `main` must also be cherry-picked or merged back into `develop` immediately after.

---

## Branch Naming

Format: `<type>/<short-kebab-description>`

Optionally prefix with a task/ticket ID: `<type>/<ticket-id>-<short-description>`

| Prefix | When to use | Example |
|---|---|---|
| `feature/` | New user-facing functionality | `feature/search-district-filter` |
| `bugfix/` | Bug fix on `develop` | `bugfix/refresh-token-race-condition` |
| `hotfix/` | Critical fix targeting `main` | `hotfix/login-crash-ios-17` |
| `refactor/` | Internal code improvement | `refactor/extract-tutor-availability-hook` |
| `docs/` | Documentation-only change | `docs/update-architecture-diagram` |
| `chore/` | Maintenance (deps, config, tooling) | `chore/upgrade-expo-sdk-52` |
| `style/` | Formatting / visual only | `style/unify-card-border-radius` |
| `test/` | Tests only | `test/add-search-filter-unit-tests` |
| `ci/` | CI/CD config only | `ci/add-e2e-test-workflow` |
| `release/` | Release preparation | `release/v1.2.0` |

**Rules:**
- Lowercase only. Hyphens as separators. No underscores. No spaces.
- Maximum 60 characters in the branch name.
- Delete branches promptly after merge.

---

## Conventional Commit Types (Reference)

| Type | Description |
|---|---|
| `feat` | New feature visible to end users |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation changes |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace (no logic change) |
| `build` | Build system or dependency changes |
| `ci` | CI configuration changes |
| `perf` | Performance improvement |
| `chore` | Maintenance, version bumps, tooling |

Commit format: `<type>(<scope>): <imperative description>`

```
feat(tutor-profile): add portfolio image upload
fix(chat): resolve message ordering bug on slow connections
refactor(search): simplify filter state with useReducer
docs(architecture): update module boundary descriptions
test(auth): add refresh token rotation integration test
chore(deps): upgrade @tanstack/react-query to 5.28.0
```

Breaking changes:
```
feat(api-applications)!: rename status values to uppercase

BREAKING CHANGE: Application status values are now uppercase enums.
Update all client status comparisons accordingly.
```

---

## Daily Feature Development Workflow

### 1. Start a new feature

```bash
# Ensure develop is up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/tutor-availability-calendar

# (Or for a bugfix)
git checkout -b bugfix/search-empty-state-missing
```

### 2. Work in small commits

Commit frequently with meaningful messages. Each commit should leave the code in a working state.

```bash
git add src/features/availability/
git commit -m "feat(availability): add CalendarPicker component"

git add src/features/availability/hooks/useAvailability.ts
git commit -m "feat(availability): implement useAvailability hook with CRUD"
```

### 3. Keep your branch up to date

```bash
# Rebase onto develop regularly to avoid large merge conflicts
git fetch origin
git rebase origin/develop
```

### 4. Open a Pull Request

- Push the branch: `git push origin feature/tutor-availability-calendar`
- Open a PR from your branch into `develop`.
- Fill out the PR template (see below).
- Mark as **Draft** while work is in progress.
- When ready for review, remove Draft status and request reviewers.

### 5. Code Review

- Reviewer leaves comments.
- Author addresses feedback with new commits (do not force-push during review).
- Reviewer approves when satisfied.

### 6. Merge

- **Squash and merge** into `develop`. The squash commit message must follow Conventional Commits format.
- Delete the source branch after merge.

### 7. Release to main

When `develop` is stable and ready for production:

```bash
# From develop, open a PR into main
# PR title: release(vX.Y.Z): <brief description of changes>
# Merge with a merge commit (not squash) to preserve history
```

---

## Hotfix Workflow

Used for critical production bugs that cannot wait for the next release cycle.

```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/crash-on-search-empty-results

# Fix, test, commit
git commit -m "fix(search): handle null response from search API"

# PR into main
# After merge into main, immediately apply to develop
git checkout develop
git pull origin develop
git cherry-pick <commit-sha>   # or merge the hotfix branch
git push origin develop
```

---

## Pull Request Template

```markdown
## Summary
<!-- What does this PR do? One paragraph. -->

## Changes
- 
- 

## Test Plan
- [ ] Manual test on iOS simulator
- [ ] Manual test on Android emulator
- [ ] Unit tests added / updated
- [ ] No hardcoded strings (all UI text uses i18n keys)

## Screenshots / Recordings
<!-- Attach if UI changes are included -->

## Checklist
- [ ] Code follows the coding standards
- [ ] No console.log left in code
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes
- [ ] Branch is up to date with develop
- [ ] Definition of Done met
```

---

## GitHub Labels

### Type Labels

| Label | Color | Description |
|---|---|---|
| `type: feature` | `#0075CA` | New functionality |
| `type: bugfix` | `#D73A4A` | Bug fix |
| `type: hotfix` | `#B60205` | Critical production fix |
| `type: refactor` | `#E4E669` | Internal code improvement |
| `type: docs` | `#0075CA` | Documentation |
| `type: chore` | `#BFDADC` | Maintenance |
| `type: test` | `#BFDADC` | Tests only |
| `type: ci` | `#BFDADC` | CI/CD |

### Status Labels

| Label | Color | Description |
|---|---|---|
| `status: in-progress` | `#FEF2C0` | Active development |
| `status: needs-review` | `#0075CA` | Ready for code review |
| `status: changes-requested` | `#D93F0B` | Reviewer requested changes |
| `status: approved` | `#0E8A16` | Approved, ready to merge |
| `status: blocked` | `#B60205` | Cannot proceed — dependency |
| `status: on-hold` | `#E4E669` | Paused intentionally |

### Priority Labels

| Label | Color | Description |
|---|---|---|
| `priority: critical` | `#B60205` | Production down / data loss risk |
| `priority: high` | `#D93F0B` | Blocks release or important user flow |
| `priority: medium` | `#FEF2C0` | Should be in next release |
| `priority: low` | `#C2E0C6` | Nice to have |

### Component Labels

| Label | Description |
|---|---|
| `component: mobile` | Mobile app (React Native) |
| `component: api` | Backend API (NestJS) |
| `component: admin` | Admin panel (React + Vite) |
| `component: landing` | Landing page (Next.js) |
| `component: auth` | Authentication module |
| `component: search` | Search and discovery |
| `component: chat` | Messaging |
| `component: payments` | Payment flows |
| `component: notifications` | Push notifications |
| `component: design-system` | Shared UI components |

### Miscellaneous Labels

| Label | Description |
|---|---|
| `good first issue` | Suitable for new contributors |
| `help wanted` | Extra attention needed |
| `duplicate` | Already reported or being worked on |
| `wontfix` | Will not be addressed |
| `breaking-change` | Introduces a breaking API or behavior change |
| `needs-migration` | Requires a database migration |
| `security` | Security-related issue |
| `performance` | Performance improvement |

---

## Commit Message Quick Reference

```
feat(scope): add new feature
fix(scope): fix a bug
refactor(scope): improve code structure
docs(scope): update documentation
test(scope): add or update tests
style(scope): formatting changes only
build(scope): change build config or dependencies
ci(scope): update CI pipeline
perf(scope): improve performance
chore(scope): maintenance task
```

Scope is the feature or module name in kebab-case: `auth`, `search`, `tutor-profile`, `chat`, `api-users`, etc.

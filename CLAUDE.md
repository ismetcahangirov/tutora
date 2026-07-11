# CLAUDE.md — Tutora AI Development Guide

This document is the **development guide for AI (Claude Code)** working on **Tutora**. It defines how code must be designed, written, reviewed, and shipped. These instructions are **binding** for every generated change.

> **Golden rule:** Claude must act as a **Senior Software Engineer** throughout the entire project lifecycle.

---

## Table of Contents

1. [Claude Code Configuration](#claude-code-configuration)
2. [Project Purpose](#project-purpose)
3. [Architecture](#architecture)
4. [Naming Convention](#naming-convention)
5. [Folder Rules](#folder-rules)
6. [Component Rules](#component-rules)
7. [Hook Rules](#hook-rules)
8. [API Rules](#api-rules)
9. [Error Handling](#error-handling)
10. [State Management](#state-management)
11. [Security Rules](#security-rules)
12. [Performance Rules](#performance-rules)
13. [Accessibility](#accessibility)
14. [Testing Rules](#testing-rules)
15. [Git Workflow](#git-workflow)
16. [Pull Request Rules](#pull-request-rules)
17. [UI Rules](#ui-rules)
18. [Code Review Checklist](#code-review-checklist)
19. [Best Practices](#best-practices)
20. [Do Not Rules](#do-not-rules)
21. [AI Coding Instructions](#ai-coding-instructions)
22. [AI Development Rules](#ai-development-rules)
23. [Definition of Done](#definition-of-done)
24. [Claude Skills](#claude-skills)
25. [AI Skill Directory](#ai-skill-directory)
26. [Repository Setup](#repository-setup)

---

## Claude Code Configuration

This project is primarily developed using **Claude Code**.

Claude should always prioritize:

- Clean Architecture
- Readable Code
- Maintainability
- Scalability
- Performance
- Security
- Strong TypeScript
- Reusable Components
- Reusable Business Logic

Claude must act as a **Senior Software Engineer** throughout the project lifecycle — proposing sound designs, questioning ambiguous requirements, and refusing to ship low‑quality or unsafe code.

---

## Project Purpose

**Tutora** is a modern platform that connects students and parents with trusted tutors through an intelligent, fast, and transparent matching experience. Parents/students find the right tutor by **budget, district, subject, rating, format (online/offline), and language** in minutes. Tutors gain a steady, predictable stream of students without depending on social media or word‑of‑mouth.

**Roles:** `Student`, `Tutor`, `Admin`.

**Surfaces:** `tutora` (mobile), `tutora-api` (backend), `tutora-admin` (admin panel), `tutora-web` (landing).

See [`README.md`](README.md) for the full product overview and [`.claude/context/`](.claude/context) for deep context.

---

## Architecture

- **Clean Architecture** with clear layer boundaries: `presentation → application (use‑cases/services) → domain → infrastructure`.
- **Feature‑First** organization. Each feature owns its `api`, `components`, `hooks`, `stores`, `types`, and a barrel `index.ts`.
- **Mobile:** React Native + Expo, Expo Router (file‑based routing). Server state via **TanStack Query**; local UI state via **Zustand/Context**; persistence via **MMKV**.
- **Backend:** NestJS modules (feature‑first). **Prisma** for data access, **Redis** for cache/queues, **BullMQ** for background jobs, **Swagger** for API docs.
- **Admin:** React + Vite, feature‑first, **shadcn/ui**, **TanStack Table/Query**, RBAC.
- **Landing:** Next.js (SSG/ISR), SEO‑first.
- **Dependency direction:** inward. Domain never imports infrastructure. UI never contains business logic.

Detailed diagrams: [`.claude/context/architecture.md`](.claude/context/architecture.md).

---

## Naming Convention

| Kind                | Convention                 | Example                    |
| ------------------- | -------------------------- | -------------------------- |
| Directories         | kebab‑case                 | `tutor-profile/`           |
| React components    | PascalCase                 | `TutorCard.tsx`            |
| Component files     | PascalCase                 | `SearchFilterSheet.tsx`    |
| Hooks               | camelCase, `use` prefix    | `useTutorSearch.ts`        |
| Stores (Zustand)    | camelCase, `Store` suffix  | `useFiltersStore.ts`       |
| Services / gateways | camelCase, `.service.ts`   | `tutors.service.ts`        |
| Types & interfaces  | PascalCase (no `I` prefix) | `Tutor`, `SearchFilters`   |
| Enums               | PascalCase, singular       | `UserRole`                 |
| Constants           | UPPER_SNAKE_CASE           | `DEFAULT_PAGE_SIZE`        |
| Booleans            | `is/has/should/can` prefix | `isVerified`, `hasReviews` |
| Event handlers      | `handle` / `on` prefix     | `handleSubmit`, `onSelect` |
| i18n keys           | dot‑namespaced             | `search.filter.district`   |
| NestJS DTOs         | PascalCase, `Dto` suffix   | `CreateTutorDto`           |
| Prisma models       | PascalCase, singular       | `Tutor`, `Review`          |
| Test files          | `*.test.ts` / `*.spec.ts`  | `useTutorSearch.test.ts`   |

---

## Folder Rules

- **Feature‑first**: group by feature, not by file type.
- Each feature exposes a **barrel `index.ts`**; import features via their barrel only.
- **Absolute imports** with an alias (`@/features/search`), never deep relative chains (`../../../`).
- Shared, cross‑feature code lives in `components/ui`, `hooks`, `lib`, `utils`, `types`.
- No feature imports another feature’s internals — only its public barrel.
- Keep files focused; split when a file grows past ~300 lines or gains a second responsibility.

---

## Component Rules

- **Functional components only.** No class components.
- **One responsibility** per component. Prefer composition over configuration.
- Keep components **< 300 lines** when avoidable; extract subcomponents and hooks.
- **No inline business logic** — move data fetching/derivation to hooks and services.
- Props are **typed** with explicit interfaces; avoid `any` and overly permissive types.
- Presentational vs. container split: UI components are pure and stateless where possible.
- Handle all UI states explicitly: **loading, empty, error, success**.
- No hardcoded strings — use **i18n keys**. No magic numbers — use **theme tokens/constants**.
- **No gradients**; use design‑system tokens for color, spacing, radius, and shadow.

---

## Hook Rules

- Encapsulate reusable logic in hooks; name them `useX`.
- Hooks must be **pure regarding React rules** (no conditional hooks, stable deps).
- **`useEffect` is a last resort.** Do not use it to derive state, transform props, or fetch data that TanStack Query should own.
  - Derive values during render or with `useMemo`.
  - Fetch with TanStack Query (`useQuery`/`useMutation`).
  - Sync external systems only (subscriptions, listeners) with `useEffect`, always with cleanup.
- Keep dependency arrays correct and complete; never disable the exhaustive‑deps lint without justification.
- Return a **stable, typed API** (object with named fields), not positional tuples for complex hooks.

---

## API Rules

- **REST**, resource‑oriented, versioned (`/api/v1/...`). Documented via **Swagger**.
- **DTOs + validation** on every input (class‑validator / Zod). Never trust client input.
- Consistent response envelope and consistent **error shape** (see Error Handling).
- **Pagination, filtering, sorting** are query‑param based and standardized.
- Client calls go through a typed **service layer** (Axios instance with interceptors for auth + refresh).
- Query keys are **structured and stable**; invalidate precisely after mutations.
- No business logic in controllers — controllers delegate to services/use‑cases.
- Rate‑limit and cache read‑heavy endpoints (Redis).

---

## Error Handling

- **Never swallow errors silently.** Log with context; surface a user‑friendly message.
- Backend: a global **exception filter** maps errors to a consistent JSON shape:
  ```json
  {
    "statusCode": 400,
    "error": "BadRequest",
    "message": "…",
    "path": "/api/v1/…",
    "timestamp": "…"
  }
  ```
- Use typed domain errors (e.g. `TutorNotFoundError`) mapped to HTTP codes.
- Client: React Query `onError` + error boundaries; show a **Toast** and an inline error state.
- Validate at the boundary (Zod schemas) and narrow types after parsing.
- Fail closed on auth/permission checks.

---

## State Management

- **Server state → TanStack Query** (caching, retries, invalidation). Do not duplicate server data in global stores.
- **Global UI state → Zustand** (small, selector‑based) or **Context** for scoped concerns.
- **Local state → `useState`/`useReducer`** within the component.
- **Persistence → MMKV** (mobile) for auth/session flags, filters, onboarding.
- **Prefer Context/Zustand over prop drilling** when state crosses multiple levels.
- Keep stores small and domain‑specific; no “god store”.

---

## Security Rules

- **No secrets in code or Git.** Use `.env` + a secrets manager; validate env at startup.
- **JWT**: short‑lived access tokens + rotated refresh tokens; store access tokens in **Expo Secure Store** (mobile) / httpOnly cookies (web/admin).
- **RBAC** on every privileged action (`RolesGuard`, permission checks). Fail closed.
- **Validate & sanitize all input**; parameterized queries via Prisma (no raw string SQL).
- **Rate limiting** and brute‑force protection on auth endpoints.
- Enforce **least privilege**; audit privileged actions (Audit Logs).
- Never log secrets, tokens, or PII. Mask sensitive fields.
- Keep dependencies patched; treat security findings as high priority.

---

## Performance Rules

- Use **FlashList** for long lists; virtualize; memoize row renderers.
- Memoize expensive computations (`useMemo`) and stable callbacks (`useCallback`) where it matters.
- Avoid unnecessary re‑renders: selector‑based store subscriptions, `React.memo` for pure components.
- **Debounce** search inputs; cancel in‑flight requests.
- Optimize images (`expo-image`, correct sizes, caching). No oversized assets.
- Backend: cache hot reads in **Redis**, add DB indexes for filter/sort columns, avoid N+1 (Prisma `include`/`select` deliberately).
- Lazy‑load heavy screens/routes; keep bundles lean.

---

## Accessibility

- Meet **WCAG AA** contrast for text and interactive elements.
- Minimum **tap target 44×44px**.
- Every interactive element has an accessible label/role (`accessibilityLabel`, `accessibilityRole`).
- Support **dynamic type**; do not hardcode font sizes that break scaling.
- Respect reduce‑motion; keep animations subtle and interruptible.
- Ensure focus order and screen‑reader flow are logical.

---

## Testing Rules

- Follow **TDD** for features and bug fixes: write a failing test first, then implement.
- **Unit tests** for hooks, services, utilities, and domain logic.
- **Integration/E2E** for critical flows: auth, search+filter, applications, reviews, payments.
- Every **bug fix ships with a regression test**.
- Tests are deterministic and isolated; no reliance on network or time without mocks.
- Keep meaningful coverage on critical paths; coverage is a means, not a target.

---

## Git Workflow

- Branch from up‑to‑date base:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/<scope>
  ```
- **One branch per task.** Naming: `feature/`, `bugfix/`, `hotfix/`, `refactor/`, `docs/`, `chore/`, `style/`, `test/`.
- **Conventional Commits**: `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `build`, `ci`, `perf`, `chore`.
- `main` and `develop` are **protected**. Never push directly.
- Rebase/update from base before opening a PR; keep history clean (squash merge).

Full workflow & labels: [`.claude/context/git-workflow.md`](.claude/context/git-workflow.md).

---

## Pull Request Rules

- Open a **Draft PR** early; use the [PR template](.github/PULL_REQUEST_TEMPLATE.md).
- Link issues (`Closes #123`). Keep PRs **small and focused**.
- CI must pass: **lint, typecheck, tests, build**.
- At least **one approval** required; address all review comments.
- **Squash merge**, then **delete the branch**.
- The PR must satisfy the [Definition of Done](#definition-of-done).

---

## UI Rules

- **No gradients anywhere.** Minimal, premium, soft colors.
- Use design‑system **tokens** for color, spacing (4pt grid), radius, shadow, and typography — never ad‑hoc values.
- **Plus Jakarta Sans** (fallback Inter). Follow the typography scale.
- Low‑elevation, soft shadows only. Default card radius **16**.
- Consistent components (Button, Input, Card, Sheet, Toast, Modal, FAB) with clear variants.
- Every screen handles **loading / empty / error / success** and supports **dark mode**.
- Motion is subtle (150–300ms), purposeful, and interruptible (Reanimated).

Complete UI/UX guide: [`.claude/context/ui-guidelines.md`](.claude/context/ui-guidelines.md).

---

## Code Review Checklist

Before marking a feature complete, review for:

- [ ] **Bugs** — correctness and edge cases
- [ ] **Performance** — no needless re‑renders, N+1, or heavy work on the main thread
- [ ] **Naming** — clear, consistent, per conventions
- [ ] **Security** — input validation, authz, no secrets, safe logging
- [ ] **Type Safety** — no `any`, precise types, exhaustive handling
- [ ] **Reusability** — shared logic extracted, no copy‑paste
- [ ] **Dead Code** — nothing unused or commented‑out left behind
- [ ] **Duplicate Logic** — DRY respected
- [ ] **Accessibility** — labels, contrast, tap targets
- [ ] **Best Practices** — idiomatic, modern React Native/TypeScript

---

## Best Practices

- Modern React (hooks, composition), modern TypeScript (generics, discriminated unions).
- Small, pure functions; explicit return types on public APIs.
- Prefer immutability; avoid side effects in render.
- Centralize configuration and constants; single source of truth.
- Document non‑obvious decisions with short comments (the “why”, not the “what”).
- Automate quality: ESLint, Prettier, Husky, lint‑staged, CI.

---

## Do Not Rules

Claude must **never** generate:

- ❌ Legacy React patterns
- ❌ Deprecated APIs
- ❌ Class Components
- ❌ Inline business logic in components
- ❌ Large components (**> 300 lines** when avoidable)
- ❌ Duplicate code
- ❌ Weak TypeScript types (`any`, unchecked casts)
- ❌ `useEffect` misuse (deriving state, fetching that belongs to React Query)
- ❌ Prop drilling where Context/Zustand is more appropriate
- ❌ Hardcoded strings (use i18n)
- ❌ Magic numbers (use tokens/constants)
- ❌ Gradients in UI
- ❌ Secrets committed to the repo

---

## AI Coding Instructions

- Prefer the **simplest correct** solution (KISS); refactor complexity out (see the `code-simplify` skill).
- Reuse existing components, hooks, and services before creating new ones.
- Read surrounding code and match its idioms, naming, and structure.
- When requirements are ambiguous, **ask** or brainstorm before coding (see the `brainstorming` skill).
- Produce strongly typed, tested, accessible, secure code by default.
- After implementing, **self‑review** against the [Code Review Checklist](#code-review-checklist) (see the `code-reviewer` skill).
- Keep changes scoped to the task; avoid unrelated edits.

---

## AI Development Rules

Every generated change must follow these priorities (**highest → lowest**):

1. **Correctness**
2. **Readability**
3. **Maintainability**
4. **Performance**
5. **Scalability**
6. **Security**
7. **User Experience**

Always prefer **modern React Native and TypeScript best practices**. Never introduce anything on the [Do Not Rules](#do-not-rules) list.

---

## Definition of Done

A task is **Done** only when:

- [ ] Meets acceptance criteria and product intent.
- [ ] Strongly typed; `typecheck` passes with no errors.
- [ ] `lint` and `format` pass; no warnings introduced.
- [ ] Unit/integration tests added and **all tests pass**; bug fixes include a regression test.
- [ ] Handles loading / empty / error / success states.
- [ ] Accessible (labels, contrast, tap targets) and dark‑mode ready.
- [ ] No hardcoded strings (i18n) and no magic numbers (tokens/constants).
- [ ] No gradients; follows the design system.
- [ ] Secure: input validated, authz enforced, no secrets, safe logging.
- [ ] Self‑reviewed against the Code Review Checklist; no dead/duplicate code.
- [ ] Docs updated where relevant; Conventional Commit + PR template followed.
- [ ] Reviewed and approved; CI green.

---

## Claude Skills

Claude should automatically utilize the following skills whenever appropriate.

### Enabled Skills

- `brainstorming`
- `code-simplify`
- `code-reviewer`
- `taste`

### Skill Usage Rules

#### brainstorming

Use during: Feature planning · Architecture discussions · UX improvements · Product ideas · Database design · API planning.

#### code-simplify

Always refactor overly complex implementations into simpler, more maintainable solutions while preserving readability and performance.

#### code-reviewer

Before considering any feature complete, review the code for: Bugs · Performance · Naming · Security · Type Safety · Reusability · Dead Code · Duplicate Logic · Accessibility · Best Practices. Provide review comments as a Senior Engineer.

#### taste

Use the Taste skill to improve: UI consistency · Component composition · Design quality · Modern code structure · Project organization · Naming quality · UX decisions.

**Taste skill reference repository:** <https://github.com/Leonxlnx/taste-skill.git>

Skill definitions live in [`.claude/skills/`](.claude/skills).

---

## AI Skill Directory

A dedicated folder holds Claude configuration, skills, prompts, and context:

```
.claude/
│
├── CLAUDE.md
│
├── skills/
│   ├── brainstorming.md
│   ├── code-simplify.md
│   ├── code-reviewer.md
│   └── taste.md
│
├── prompts/
│   ├── feature-planning.md
│   ├── bug-fix.md
│   ├── refactor.md
│   ├── ui-review.md
│   └── release.md
│
└── context/
    ├── architecture.md
    ├── ui-guidelines.md
    ├── coding-standards.md
    ├── git-workflow.md
    └── project-rules.md
```

> The `taste` skill is adapted from <https://github.com/Leonxlnx/taste-skill.git>.

---

## Repository Setup

| Concern           | Value               |
| ----------------- | ------------------- |
| Repository name   | `tutora`            |
| Application name  | **Tutora**          |
| Bundle identifier | `com.tutora.mobile` |
| Admin panel       | `tutora-admin`      |
| Landing page      | `tutora-web`        |
| Backend           | `tutora-api`        |

---

<div align="center">

**Tutora** — build it clean, build it premium, build it to scale.

</div>

# Tutora — Coding Standards

## Guiding Principles

1. **Clean Architecture** — Strict layer separation. Presentation never touches infrastructure. Domain contains zero framework code.
2. **SOLID** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Enforce at code review.
3. **DRY** — Extract any logic duplicated more than twice into a shared utility, hook, or service.
4. **KISS** — Prefer the simplest solution that correctly solves the problem. Do not over-engineer.
5. **AI Priority Order** — When trade-offs arise: Correctness > Readability > Maintainability > Performance > Scalability > Security > UX.

---

## Feature-First Folder Structure

Group code by **feature/domain**, not by technical layer.

### Mobile (`src/features/<feature-name>/`)

```
src/
  features/
    auth/
      components/       ← UI components specific to this feature
      hooks/            ← feature hooks (useLogin, useRegister)
      screens/          ← Expo Router screen wrappers
      services/         ← API call functions (not hooks)
      types/            ← TypeScript types/interfaces/enums
      constants/        ← feature-scoped constants
      utils/            ← pure helper functions
      index.ts          ← barrel export (public API of the feature)
    search/
    tutor-profile/
    applications/
    chat/
    reviews/
    profile/
  shared/
    components/         ← reusable atoms (Button, Input, Card, Avatar…)
    hooks/              ← cross-feature hooks (useDebounce, useTheme…)
    lib/                ← configured singletons (axios, queryClient, i18n, mmkv)
    types/              ← global types
    utils/              ← global pure utilities
    constants/          ← global constants (colors, spacing, etc.)
```

**Rules:**
- A feature may import from `shared/`. Features must not import from other features directly.
- Cross-feature communication happens via navigation params, shared state (Zustand store), or events.
- Every feature exposes a single `index.ts` barrel; consumers import from `@features/auth`, not from internal paths.

---

## Absolute Imports

Configure path aliases via `tsconfig.json` and `babel.config.js` / `metro.config.js`:

```json
// tsconfig.json (paths)
{
  "@features/*": ["src/features/*"],
  "@shared/*":   ["src/shared/*"],
  "@app/*":      ["src/app/*"]
}
```

**Always use aliases. Never use `../../..` relative paths.**

---

## Barrel Exports

Every directory that is a public module boundary must have an `index.ts`:

```ts
// src/features/auth/index.ts
export { LoginScreen }  from './screens/LoginScreen';
export { useLogin }     from './hooks/useLogin';
export type { AuthUser } from './types';
```

Do not re-export private internals. If it is not in `index.ts`, it is internal to the feature.

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `TutorCard.tsx` |
| Files (hooks) | camelCase, `use` prefix | `useTutorProfile.ts` |
| Files (services) | camelCase | `tutorService.ts` |
| Files (types) | camelCase | `tutor.types.ts` |
| Files (constants) | camelCase | `tutor.constants.ts` |
| Files (utils) | camelCase | `formatPrice.ts` |
| Files (screens) | PascalCase, `Screen` suffix | `TutorDetailScreen.tsx` |
| React components | PascalCase | `TutorCard` |
| Hooks | camelCase, `use` prefix | `useTutorProfile` |
| Types / Interfaces | PascalCase | `TutorProfile`, `SearchFilters` |
| Enums | PascalCase | `ApplicationStatus` |
| Enum values | SCREAMING_SNAKE_CASE | `ApplicationStatus.PENDING` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SEARCH_RESULTS` |
| Variables / functions | camelCase | `formatRating`, `tutorList` |
| NestJS controllers | PascalCase, `Controller` suffix | `TutorsController` |
| NestJS services | PascalCase, `Service` suffix | `TutorsService` |
| NestJS DTOs | PascalCase, `Dto` suffix | `CreateApplicationDto` |
| Prisma models | PascalCase (match schema) | `User`, `Tutor`, `Application` |

---

## TypeScript Standards

- **`strict: true`** always. No `any`. No `@ts-ignore` without a documented justification comment.
- Prefer `interface` for object shapes; use `type` for unions, intersections, and aliases.
- Use `unknown` instead of `any` when type is truly unknown; narrow with guards.
- Use generic constraints (`<T extends object>`) rather than `any` in utility functions.
- Avoid non-null assertion (`!`) unless you have provably ruled out null. Prefer optional chaining.
- Export types from feature `index.ts` if consumers need them; keep internal types private.
- Discriminated unions for complex state:
  ```ts
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: Error };
  ```

---

## Component Rules

- **Maximum 300 lines** per component file. If longer, extract sub-components.
- **Single responsibility.** One component = one clear purpose.
- **No logic in JSX.** Extract conditionals and transformations to variables or helper functions above the return.
- **Props interface** always explicitly typed; never use `any` in props.
- Destructure props in the function signature.
- Default export for screen/page components. Named exports for all others.
- **No inline styles.** Use `StyleSheet.create` (React Native) or NativeWind className strings.
- Keep effects (`useEffect`) minimal. Prefer derived state and event handlers.
- Do not fetch data inside components — delegate to custom hooks.

```ts
// Good
function TutorCard({ tutor, onPress }: TutorCardProps) {
  const ratingLabel = formatRating(tutor.rating);
  return (
    <Pressable onPress={onPress}>
      <Text>{tutor.name}</Text>
      <Text>{ratingLabel}</Text>
    </Pressable>
  );
}

// Bad — logic mixed into JSX, inline style, implicit any
function TutorCard(props: any) {
  return (
    <Pressable style={{ padding: 16 }} onPress={props.onPress}>
      <Text>{props.tutor.rating > 0 ? props.tutor.rating.toFixed(1) : 'No rating'}</Text>
    </Pressable>
  );
}
```

---

## Hook Rules

- Hooks may only be called at the top level of a function component or another hook.
- Name all hooks with `use` prefix.
- One hook = one domain concern. `useTutorProfile` handles tutor profile data; it does not also handle navigation.
- Return a typed object (not a tuple) when returning more than two values.
- Document with a one-line JSDoc comment.

---

## Service / API Layer Rules

- API call functions live in `features/<name>/services/`.
- Functions are plain async functions (not hooks) that call the Axios instance.
- The Axios instance is a singleton in `shared/lib/axios.ts` with interceptors for auth token injection and 401 handling.
- Services do not contain business logic — they only call the API and return typed responses.
- Define response types in `features/<name>/types/`.

```ts
// features/tutors/services/tutorService.ts
import { api } from '@shared/lib/axios';
import type { TutorProfile, SearchFilters, PaginatedResponse } from '../types';

export async function searchTutors(filters: SearchFilters): Promise<PaginatedResponse<TutorProfile>> {
  const { data } = await api.get('/search', { params: filters });
  return data;
}
```

---

## Error Handling

- Always handle promise rejections. Never use floating promises.
- Use TanStack Query's built-in `error` state for server data errors; do not put errors into component state.
- For critical user-facing errors, render an error UI with a retry action (not just a console.error).
- For background/silent errors, log to a structured logger.
- Define a shared `AppError` type:
  ```ts
  interface AppError {
    code: string;       // machine-readable, e.g. 'TUTOR_NOT_FOUND'
    message: string;    // human-readable (localized)
    statusCode?: number;
  }
  ```
- Axios interceptors should normalize API error responses to `AppError` before TanStack Query sees them.
- NestJS backend: use `HttpException` subclasses. Never leak stack traces to clients. Log full errors server-side via pino.

---

## State Management

| State Type | Tool | Notes |
|---|---|---|
| Server data (API responses) | **TanStack Query** | Caching, background refresh, optimistic updates |
| Local / UI state | **useState / useReducer** | Form state (via React Hook Form), toggles, modals |
| Cross-feature shared state | **Zustand** (or React Context for small cases) | Auth user, theme, notification count |
| Persisted client state | **MMKV** (via zustand-persist or direct) | Tokens (use expo-secure-store for refresh token), locale preference, onboarding seen |

**Rules:**
- Do not store server data in Zustand — let TanStack Query own it.
- Do not use Redux. Do not use MobX.
- Zustand stores must be typed and use the `immer` middleware for mutations on nested objects.
- MMKV is synchronous; do not use `AsyncStorage` for performance-sensitive reads.
- Sensitive data (refresh tokens) must use `expo-secure-store`, never MMKV or AsyncStorage.

---

## Performance Rules

### Mobile

- Use **FlashList** (not FlatList) for any list with more than 10 items.
- Memoize expensive computed values with `useMemo`. Memoize callbacks passed as props with `useCallback`.
- Wrap pure display components in `React.memo` when they appear in lists.
- Avoid re-renders: use `select` in Zustand to subscribe to only the slice of state needed.
- Lazy-load screens with React Navigation / Expo Router's built-in lazy loading.
- Image loading: use `expo-image` (not the RN Image) for automatic caching and blurhash placeholders.
- Avoid anonymous functions in JSX props when rendering lists.

### Backend

- Use Redis cache-aside for any endpoint that is read-heavy and has tolerable staleness.
- Paginate all list endpoints. Default page size: 20. Maximum: 100.
- Use Prisma `select` to fetch only required columns; avoid `findMany` without field selection on large tables.
- Use BullMQ for any operation that does not need to complete synchronously (emails, push notifications, image processing).
- Index all foreign key columns and any column used in `WHERE` or `ORDER BY` clauses.

---

## ESLint / Prettier / Husky

### ESLint

- `@typescript-eslint/recommended` + `eslint-plugin-react` + `eslint-plugin-react-hooks` + `eslint-plugin-import`.
- `no-console`: warn (use structured logger instead).
- `@typescript-eslint/no-explicit-any`: error.
- `react-hooks/rules-of-hooks`: error.
- `react-hooks/exhaustive-deps`: warn.
- Import order: builtins → external → internal (aliased) → relative. Enforced by `eslint-plugin-import`.

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Husky + lint-staged

```json
// .lintstagedrc
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

Pre-commit hook runs lint-staged. Pre-push hook runs `tsc --noEmit` and tests.

---

## Conventional Commits

Format: `<type>(<scope>): <description>`

| Type | When to use |
|---|---|
| `feat` | New feature visible to users |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace (no logic change) |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `perf` | Performance improvement |
| `chore` | Maintenance tasks (version bumps, config) |

**Scope examples:** `auth`, `search`, `tutor-profile`, `chat`, `api-users`, `admin-dashboard`.

```
feat(search): add district filter to tutor search results
fix(auth): prevent duplicate refresh token requests on 401
refactor(tutor-profile): extract useAvailability hook from TutorProfileScreen
```

Breaking changes: append `!` after type/scope and add `BREAKING CHANGE:` footer.

```
feat(api-auth)!: remove /auth/register/v1 endpoint

BREAKING CHANGE: Use /auth/register instead. v1 endpoint removed.
```

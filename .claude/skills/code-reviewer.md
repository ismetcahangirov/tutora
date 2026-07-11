# Code Reviewer Skill — Tutora

## When to Use

Run this review before any feature branch is considered complete — before opening a PR, before asking for QA, and before merging. Also use when receiving a PR from another contributor.

This is a Senior Engineer review lens. The goal is not to nitpick style but to catch:
- Bugs that will reach production
- Security issues specific to an auth-heavy, multi-role platform
- Code that will cause pain to the next engineer

---

## Review Dimensions

Work through each dimension in order. Don't skip a category because a file "looks fine."

---

### 1. Bugs

Questions to ask:
- Are there unhandled edge cases (empty array, null, undefined, 0, empty string)?
- Is async error handling correct? (missing `try/catch`, unhandled promise rejections)
- Are race conditions possible? (double-tap submit, concurrent writes)
- Does optimistic UI correctly roll back on failure?
- Are list operations correct off-by-one?

Tutora examples to watch for:
- A booking creation endpoint that doesn't check for overlapping sessions before inserting
- A mobile screen that renders before data is loaded (missing loading state)
- A form that can be submitted twice because the submit button isn't disabled during the request

---

### 2. Performance

Questions to ask:
- Are there N+1 query patterns? (loop calling DB per iteration — use Prisma `include` or batch)
- Are expensive computations memoized where appropriate?
- Are large lists paginated? (never fetch all tutors, all sessions, all reviews unbounded)
- Are images optimized and lazy-loaded on mobile?
- Is a `useEffect` running too often due to a missing or incorrect dependency array?

---

### 3. Naming

Questions to ask:
- Does the name describe what the thing IS or DOES, not how it works internally?
- Are booleans named with `is`, `has`, `can`, `should` prefix?
- Are event handlers named `handle*` (e.g. `handleSubmit`, `handleSessionSelect`)?
- Are types named with a noun (e.g. `TutorProfile`, `SessionStatus`)?
- Are files and folders using consistent casing (kebab-case for files, PascalCase for components)?

---

### 4. Security

Questions to ask:
- Does every protected NestJS route have the correct `@Roles()` guard and `@UseGuards(AuthGuard, RolesGuard)`?
- Is user input validated and sanitized? (use `class-validator` DTOs in NestJS)
- Are JWT tokens validated server-side, not just client-side?
- Are Supabase RLS policies in place for any table that is accessed by multiple roles?
- Is any sensitive data (tokens, passwords, PII) being logged?
- Are file uploads validated for type and size?
- Is there SQL injection risk? (should be none with Prisma parameterized queries — but check raw queries)

Tutora-specific security checklist:
- [ ] Tutor data is not readable by unauthenticated requests
- [ ] A student cannot modify another student's booking
- [ ] An admin action (e.g. verify tutor) is behind an `admin` role guard
- [ ] Phone numbers / emails are not returned in public tutor listing responses

---

### 5. Type Safety

Questions to ask:
- Are there any `any` types? (`any` must have a comment explaining why it's unavoidable)
- Are API response types defined and used — not inferred as `unknown` and then cast?
- Are Prisma-generated types used correctly, or are there manual type redefinitions that can drift?
- Are discriminated unions used where an entity can be in multiple states?
- Are optional fields (`?`) used intentionally — not just to silence TypeScript errors?

---

### 6. Reusability

Questions to ask:
- Is this logic specific to one screen, or could it be a shared hook or utility?
- Is this component accepting too many props because it's doing too many jobs?
- Would a new developer know to find this utility before re-implementing it?

---

### 7. Dead Code

Questions to ask:
- Are there unused imports?
- Are there commented-out blocks that should be deleted?
- Are there variables declared but never read?
- Are there features flagged off with `if (false)` or `if (process.env.ENABLE_X)` that were never turned on?

Run `tsc --noEmit` to catch unused variables if `noUnusedLocals` is enabled.

---

### 8. Duplicate Logic

Questions to ask:
- Does this logic already exist somewhere in the codebase?
- Is the same Prisma query written in two service files?
- Is the same date formatter copy-pasted in three components?

Check the relevant feature folder and `utils/` before approving new implementations.

---

### 9. Accessibility (Mobile + Web)

Questions to ask:
- Do interactive elements have `accessibilityLabel` (React Native) or `aria-label` (web)?
- Are touch targets at least 44x44pt on mobile?
- Does the UI work if the user has increased their font size?
- Are error messages surfaced to screen readers?
- Is tab order logical on the admin web UI?

---

### 10. Best Practices

Questions to ask:
- Does this follow the Clean Architecture pattern established in the codebase?
  - Controllers only handle HTTP, not business logic
  - Services contain business logic, not Prisma calls
  - Repositories handle data access
- Are environment variables read from a central config module, not directly from `process.env` scattered across files?
- Are migrations backwards-compatible? (additive changes, no destructive column drops on first deploy)
- Are new API endpoints documented (OpenAPI / Swagger decorator annotations in NestJS)?

---

## Review Comment Format

Use this format for every finding. Group findings by file.

```
[SEVERITY] file/path:line — Issue title
Description: What is wrong and why it matters.
Suggestion: What to do instead, with a short code example if helpful.
```

Severity levels:
- `[CRITICAL]` — Will cause a bug, data loss, or security issue. Must fix before merge.
- `[MAJOR]` — Significant quality problem. Should fix before merge.
- `[MINOR]` — Code smell, naming issue, style. Fix recommended but can defer.
- `[NIT]` — Trivial preference. Fix only if it takes 30 seconds.

Example:

```
[CRITICAL] features/sessions/sessions.service.ts:87 — No overlap check before booking insert
Description: createSession inserts directly without checking if the tutor already has
a session at the requested time. Two concurrent requests will create a double booking.
Suggestion: Add a unique constraint on (tutor_id, start_at) or an explicit overlap query
before the insert. A database-level constraint is the safest backstop.

[MAJOR] features/tutors/TutorCard.tsx:34 — `any` type on API response
Description: The tutor object is typed as `any`, silencing all downstream type errors.
Suggestion: Import and use the generated Prisma type `Tutor` or define a `TutorSummary`
DTO and share it between API and mobile.

[MINOR] features/auth/auth.guard.ts:12 — Misleading boolean name
Description: Variable `check` does not communicate what is being checked.
Suggestion: Rename to `isTokenValid`.

[NIT] features/sessions/sessions.controller.ts:3 — Unused import
Description: `Injectable` is imported but not used.
Suggestion: Remove.
```

---

## Final Checklist

Before approving or marking self-review complete:

**Correctness**
- [ ] No unhandled edge cases (null, empty, concurrent)
- [ ] Async errors are caught and handled
- [ ] No N+1 queries

**Security**
- [ ] Every protected endpoint has role guard
- [ ] User input is validated via DTO
- [ ] RLS policies in place for multi-role data
- [ ] No sensitive data in logs

**Type Safety**
- [ ] No `any` without justification
- [ ] API response types defined and used
- [ ] `tsc --noEmit` passes

**Code Quality**
- [ ] No duplicate logic
- [ ] No dead code / commented-out blocks
- [ ] No components over ~300 lines
- [ ] No gradients in UI (design constraint)
- [ ] Naming follows conventions

**Architecture**
- [ ] Clean Architecture layers respected (Controller → Service → Repository)
- [ ] No business logic in controllers
- [ ] Feature stays in its feature folder

**i18n**
- [ ] All user-facing strings use i18n keys (no hardcoded English strings in components)
- [ ] New keys added to all locale files

**Accessibility**
- [ ] Interactive elements have accessibility labels
- [ ] Error messages are surfaced appropriately

---

## Tutora-Specific Concerns Summary

| Area | What to Check |
|---|---|
| RLS / RBAC | Every table touched by multiple roles has RLS. Every admin action has `@Roles('admin')`. |
| JWT | Tokens validated server-side. Expiry handled on mobile (401 → re-auth flow). |
| i18n keys | No raw English strings in JSX/TSX. Keys exist in all locale files. |
| No gradients | Zero CSS `gradient` usage. Background colors from the design token palette only. |
| Component size | No component over ~300 lines. Flag and suggest split. |
| Prisma migrations | Migrations are additive. No column drops or type changes without a deprecation plan. |
| shadcn/ui | Admin UI uses existing shadcn components before building custom ones. |

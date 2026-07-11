# Code Simplify Skill — Tutora

## When to Use

Invoke before marking any implementation task complete, and proactively on any file that:

- Exceeds ~300 lines
- Has been touched more than 3 times in a short window (sign of reactive patching)
- Causes confusion when reading it aloud — if you have to explain it, simplify it
- Triggers the smells listed below

Also use after a feature is working but before code review — simplification is not refactoring for its own sake, it is making the code say what it means.

---

## Smells to Look For

### 1. Deep Nesting

```ts
// Bad
if (user) {
  if (user.role === 'tutor') {
    if (tutor.isVerified) {
      if (session.status === 'pending') {
        // actual logic buried 4 levels deep
      }
    }
  }
}

// Better — early returns / guard clauses
if (!user || user.role !== 'tutor') return null;
if (!tutor.isVerified) return <UnverifiedBanner />;
if (session.status !== 'pending') return <SessionStatus status={session.status} />;
// actual logic at top level
```

### 2. Duplication

Same logic copy-pasted across two or more places. Common Tutora examples:

- Date formatting in multiple screen components
- Auth header injection in multiple API calls
- RLS check logic repeated in two NestJS services

Fix: extract to a utility, hook, or shared service method.

### 3. God Components / God Services

A single component or class that does too many things. Signs:

- 400+ lines
- Multiple distinct sections separated by comments like `// ---- FORM LOGIC ----`
- Imports from 10+ other modules
- Props interface has more than 8–10 properties

Fix: split by responsibility (see Step 4 below).

### 4. Prop Drilling

Passing the same prop through 3+ component layers without it being used in intermediate layers.

Fix: React Context, or restructure so the consumer is closer to the source.

### 5. Premature Abstraction

An abstraction built for a flexibility that was never needed.

Signs:

- A generic `<DataTable config={...} />` that is only ever used once
- A factory function that produces only one type
- A base class with one subclass

Fix: inline the abstraction. Generalize only when the second real use case arrives.

### 6. Unclear Naming

Names that describe implementation instead of intent:

```ts
// Bad
const d = new Date(s.startAt);
const arr = sessions.filter((x) => x.status === 'active');

// Better
const sessionDate = new Date(session.startAt);
const activeSessions = sessions.filter((s) => s.status === 'active');
```

### 7. Commented-Out Code

Dead code left "just in case." Delete it — git history exists for recovery.

### 8. Magic Numbers / Strings

```ts
// Bad
if (sessions.length > 5) { ... }
if (user.role === 'admin') { ... }

// Better
const MAX_SESSIONS_PER_WEEK = 5;
if (sessions.length > MAX_SESSIONS_PER_WEEK) { ... }
```

---

## Step-by-Step Simplification Process

### Step 1 — Read Without Editing

Read the entire file first. Note:

- What is the single responsibility of this file?
- Which lines are the actual logic vs. boilerplate/wiring?
- What would you delete if you had to cut the file in half?

### Step 2 — Identify the Largest Win

Do not try to fix everything at once. Find the one change that eliminates the most complexity. This is usually: extracting a large block, collapsing nested conditionals, or removing duplication.

### Step 3 — Apply Guard Clauses

Invert conditionals to exit early. This flattens nesting and puts the happy path at the end.

### Step 4 — Split by Responsibility

For components over ~300 lines, split along these natural seams:

| Seam                        | Extract to                             |
| --------------------------- | -------------------------------------- |
| Data fetching / async logic | Custom hook (`useTutorSessions.ts`)    |
| Form state + validation     | Form hook or separate form component   |
| A repeated UI pattern       | New component                          |
| Business logic              | Service layer / utility                |
| Type definitions            | `types.ts` co-located with the feature |

Tutora example — a 400-line `TutorProfileScreen.tsx`:

```
Before: TutorProfileScreen.tsx (400 lines)
  - API calls
  - Form state for editing profile
  - Image upload logic
  - Rating display
  - Availability calendar

After:
  TutorProfileScreen.tsx         (~80 lines, layout only)
  useTutorProfile.ts             (data fetching + mutations)
  TutorProfileForm.tsx           (form fields + validation)
  TutorRatingSummary.tsx         (rating display)
  TutorAvailabilityCalendar.tsx  (calendar widget)
  tutor-profile.types.ts         (shared types)
```

### Step 5 — Extract Utilities

Move pure functions to `utils/` or co-located `*.utils.ts`. Pure functions are easy to test and easy to reuse.

```ts
// Before: inline in component
const label = `${Math.floor(mins / 60)}h ${mins % 60}m`;

// After: in utils/formatDuration.ts
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
```

### Step 6 — Verify Behavior is Unchanged

After simplification:

- Run existing tests
- Manually verify the key user flow still works
- Check TypeScript has no new errors (`tsc --noEmit`)
- If there are no tests for the area changed, note it as a follow-up

### Step 7 — Review Naming One More Time

After restructuring, re-read every variable, function, and file name. Names that made sense in a large file may be redundant or confusing in a smaller focused file.

---

## Checklist

- [ ] File has a single clear responsibility
- [ ] No function or component is doing more than one thing
- [ ] No deep nesting (max 2–3 levels)
- [ ] No duplicated logic — extracted to shared utility or hook
- [ ] No commented-out code
- [ ] No magic numbers or magic strings
- [ ] Naming describes intent, not implementation
- [ ] Components stay under ~300 lines
- [ ] No prop drilling beyond 2 levels
- [ ] Types are co-located or in a shared `types.ts`
- [ ] Existing tests still pass
- [ ] TypeScript compiles with no new errors

---

## Tutora-Specific Reminders

- **Feature-first structure**: code lives in `features/<feature-name>/`. Do not scatter utilities into unrelated folders.
- **No god screens**: React Native screens in `tutora-app` must stay lean — all data logic in hooks, all sub-UI in sub-components.
- **NestJS services**: a service method should do one thing. If a method calls 4+ other services, it likely should be a use-case class.
- **Prisma queries**: complex Prisma `findMany` calls with 5+ `include` / `where` clauses should be extracted to a repository method with a descriptive name.
- **shadcn/ui in admin**: do not reinvent components that shadcn already provides. Before building a custom table, modal, or form — check the component library.

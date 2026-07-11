# Refactor Prompt Template

Use this process whenever refactoring existing code. The prime directive of refactoring is: **behavior must not change.** If the refactor changes observable behavior, it is not a refactor — it is a feature or bug fix (handle those separately).

---

## Step 1 — Identify the Smell

Name the problem clearly before proposing a solution.

**Common code smells in this codebase:**

| Smell                  | Description                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------- |
| Large component        | Component over 300 lines, handles multiple concerns                                     |
| God hook               | Hook that fetches data, manages complex state, handles navigation, and has side effects |
| Repeated logic         | Same calculation or transformation in 3+ places                                         |
| Anemic service         | Service function that just passes data through with no logic                            |
| Inconsistent naming    | Mix of conventions (camelCase vs. PascalCase, `get` vs. `fetch` prefixes)               |
| Hardcoded values       | Magic strings/numbers that should be constants or design tokens                         |
| Prop drilling          | Data passed through 3+ component levels without a state manager                         |
| Implicit any           | TypeScript types weakened with `any` or missing entirely                                |
| Inline style           | StyleSheet or className strings scattered in JSX instead of a token                     |
| Missing abstraction    | Two very similar features implemented without a shared abstraction                      |
| Over-abstraction       | A generic utility so abstract it is harder to understand than repeating the code        |
| Side effects in render | Data fetching or mutations directly in the component body, not in effects or hooks      |
| Wrong layer            | Business logic in a controller, API call in a screen component                          |

**Document the smell:**

> Smell identified: [name]
> Location: [file path(s), line numbers]
> Evidence: [paste the offending code snippet or describe the pattern]
> Why it matters: [what problem does this cause — maintainability, testability, readability, bugs?]

---

## Step 2 — Define the Goal (Scope Clearly)

Refactoring without a clear end state leads to over-engineering or never finishing.

**Answer these questions before starting:**

1. What is the specific improvement? (e.g., "Extract three duplicated `formatPrice` implementations into one shared utility")
2. What does the code look like after the refactor? (Sketch the target structure)
3. What is **out of scope**? (Do not fix other smells in passing — create separate tickets)
4. How large is the change? (Files affected, estimated hours)
5. Is this refactor safe to do now, or does it risk destabilizing something in active development?

**If the refactor touches more than 10 files:** break it into smaller independent steps and do each as a separate PR.

---

## Step 3 — Ensure Test Coverage Before Touching Code

This is the most important step. **Do not refactor code that is not tested.** Tests are what prove behavior is preserved.

**For each unit being refactored:**

1. Check existing test coverage: `jest --coverage --testPathPattern=<feature>`
2. If coverage is insufficient, **write tests first** that capture the current behavior — even if that behavior is not ideal.
3. Ensure tests are at the right level of abstraction (test behavior and outputs, not implementation details).
4. Run the full test suite to confirm it is green before any changes.

```bash
# Run tests for the affected feature
npx jest src/features/search --coverage

# Confirm all pass
npx jest --runInBand
```

If you cannot write tests for the code before refactoring (e.g., no way to inject dependencies), restructure to make it testable as the first step of the refactor.

---

## Step 4 — Refactor in Small, Verified Steps

Never make multiple large changes at once. Each step must:

1. Be a single, coherent change
2. Leave the tests passing
3. Be committable on its own

**Canonical refactoring steps (in order of typical safety):**

1. **Rename** — Rename variables, functions, types to match naming conventions. Safe; no behavior change.
2. **Extract** — Extract a function, hook, or component from a larger one. Run tests after each extraction.
3. **Move** — Move extracted code to the correct layer or file. Update all import paths.
4. **Inline** — Remove an over-abstracted wrapper by inlining what it does. Run tests.
5. **Replace** — Replace a pattern (e.g., `any` types → proper types; `AsyncStorage` → MMKV). Do one file at a time.
6. **Consolidate** — Merge duplicated implementations into a single shared one. Keep the old signatures briefly using re-exports, then clean up callers, then remove re-exports.

**After each step:**

```bash
npx tsc --noEmit   # zero type errors
npx eslint .       # zero lint errors
npx jest           # all tests pass
```

Commit after each verified step with a `refactor` commit type:

```
refactor(search): extract useSearchFilters hook from SearchScreen
refactor(shared): move formatPrice to shared/utils/currency.ts
refactor(auth): replace any types with AuthUser interface
```

---

## Step 5 — Verify Behavior Preservation

After all refactor steps are complete:

1. Run the **full test suite** — it must be fully green.
2. **Manual smoke test** — walk through the flows that were affected.
3. If the refactor touched shared utilities: test every feature that uses them.
4. Check for regressions in edge cases: empty state, error state, loading state, dark mode.

**Behavioral equivalence checklist:**

- [ ] All existing tests pass
- [ ] No new TypeScript errors
- [ ] No new ESLint errors
- [ ] Manual testing of affected features passes
- [ ] API contracts unchanged (if backend refactor)
- [ ] No changes to UI appearance (if component refactor)

---

## Step 6 — Measure the Improvement

Articulate what was achieved. This validates the effort and documents the decision.

**Metrics to consider:**

- Lines of code: before vs. after (smaller is often better, but not always)
- Cyclomatic complexity: did the key function become simpler?
- Test coverage: did it increase?
- Duplication: how many instances of the repeated code were eliminated?
- Readability: is the intent of the code clearer?

**Write a brief summary** in the PR description:

```
Before: SearchScreen.tsx was 480 lines, fetched data, managed filter state,
        handled navigation, and rendered the list — 4 responsibilities.

After: SearchScreen.tsx is 180 lines and only renders.
  - useSearchFilters (80 lines) manages filter state
  - useSearchResults (60 lines) fetches and caches results
  - SearchFilterBar extracted as a reusable component

No behavior change. Test coverage on the filters logic: 0% → 87%.
```

---

## Rules

- **Never refactor and add features in the same PR.** Separate them completely.
- **Never refactor and fix bugs in the same PR.** The bug fix must be provable on its own.
- If you discover a bug during refactoring, stop, commit the refactor to date, create a bug ticket, and fix it in a separate branch.
- A refactor PR should have a green diff — no net new features, no behavior changes.
- When in doubt about whether a change is safe, add a test that would fail if the behavior changes, make the change, and confirm the test still passes.

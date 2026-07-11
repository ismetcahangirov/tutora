# Bug Fix Prompt Template

Use this systematic process for every bug, regardless of how obvious the fix appears. Skipping steps leads to incomplete fixes and regressions.

Mindset: **Understand before fixing. Test before shipping.**

---

## Step 1 — Reproduce the Bug

Before touching any code, establish a reliable reproduction.

**Document:**
- Exact steps to reproduce (numbered, copy-pasteable)
- Expected behavior
- Actual behavior
- Environment: iOS / Android / API / Admin / Landing — version / OS version / device
- Frequency: always / intermittent / only under specific conditions
- When first observed: (after which commit or release?)

**Can you reproduce it locally?**
- If yes: proceed to Step 2.
- If intermittent: add temporary logging to capture the conditions, then reproduce.
- If only in production: check API logs (pino), Sentry / crash reports, and Redis state.

**Can you reproduce it in a minimal test case?**
- Strip away unrelated code until you have the smallest possible reproduction.
- This often reveals the root cause by itself.

---

## Step 2 — Root Cause Analysis

Do not guess. Read the code.

**Questions to answer:**
1. What is the exact line / function where the unexpected behavior originates?
2. What is the data state at that point? (Log it or use a debugger breakpoint)
3. Why does the code do what it does? (Read the logic — do not assume)
4. What assumption in the original code is wrong?
5. Is this a local bug (one component / function) or a systemic bug (wrong model, wrong data flow, incorrect contract between layers)?

**Common root cause categories:**
- Off-by-one / boundary condition not handled
- Race condition (async not awaited, concurrent requests)
- State mutation (direct mutation of React state or Zustand store)
- Missing null / undefined guard
- Wrong API contract assumed by client
- Type coercion (e.g., string compared to number)
- Stale closure (callback capturing outdated state)
- Missing dependency in `useEffect`
- Cache invalidation not triggered after write
- Role/permission check missing or wrong scope

**Write your root cause diagnosis here:**

> Root cause: [one paragraph describing exactly what goes wrong and why]

---

## Step 3 — Write a Failing Test First

Before writing the fix, write a test that:
1. Reproduces the exact bug
2. Currently **fails** (proving the bug exists)
3. Will **pass** after the fix

This is the core of TDD applied to bug fixing.

```ts
// Example: hook test for a race condition bug
it('should not apply stale search results when filters change rapidly', async () => {
  // Arrange: simulate rapid filter changes
  // Act: trigger two search calls with different filters
  // Assert: only the result for the latest filter is displayed
});
```

If the bug is in the UI layer, write the test at the closest testable boundary (hook, service, utility — not the component).

If the bug is on the backend, write an integration test targeting the controller or service.

---

## Step 4 — Implement the Fix

With the failing test as your guide, implement the minimal fix.

**Rules:**
- Fix the root cause — not the symptom.
- Make the smallest possible change that makes the failing test pass without breaking other tests.
- Do not refactor or add unrelated improvements in the same commit as the fix.
- If the fix is complex, add an inline comment explaining **why** the code is written that way.

```ts
// Before
function formatPrice(price: number) {
  return price / 100;  // Bug: not handling undefined price
}

// After
function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return '—';
  return (price / 100).toFixed(2);
}
```

---

## Step 5 — Verify

Run all tests and perform manual verification.

**Automated checks:**
- [ ] The previously failing test now passes
- [ ] All existing unit tests still pass
- [ ] All existing integration tests still pass
- [ ] `tsc --noEmit` passes (zero type errors)
- [ ] ESLint passes

**Manual verification:**
- [ ] Bug cannot be reproduced following the original reproduction steps
- [ ] Happy path still works correctly
- [ ] Test on iOS and Android if mobile change
- [ ] Test in dark mode if UI change
- [ ] Test with network error if network-related change

---

## Step 6 — Regression Check

Actively look for related areas that might have the same bug.

**Questions:**
1. Is this bug pattern repeated elsewhere in the codebase? Search for similar code.
2. Does this fix have any side effects on other features? Think through the call graph.
3. Are there other entry points to the same bug? (Other screens, API endpoints, user roles)
4. Does this fix need to be applied to multiple environments or repos?

**Search for the bug pattern:**

```bash
# Example: search for unguarded price access
grep -r "price / 100" src/
grep -r "\.price\b" src/features/
```

If you find the same issue elsewhere, fix it in the same PR (or create follow-up tickets for lower-priority occurrences).

---

## Step 7 — Write the Commit

Commit message format for bug fixes:

```
fix(<scope>): <imperative description of what was fixed>

Problem: <one sentence describing the bug>
Root cause: <one sentence describing why it happened>
Fix: <one sentence describing the change made>

Closes #<issue-number> (if applicable)
```

**Example:**
```
fix(search): prevent stale results when district filter changes rapidly

Problem: Selecting a different district quickly after an initial search
would sometimes display results from the first search.
Root cause: The async query was not cancelled when filters changed,
allowing an older response to overwrite a newer one.
Fix: Added AbortController cancellation via TanStack Query's signal
parameter, and sorted results by query key to discard stale responses.

Closes #142
```

---

## Checklist Before Merging

- [ ] Root cause documented in commit message
- [ ] Failing test written before fix
- [ ] Test now passes
- [ ] All existing tests still pass
- [ ] Manual reproduction steps confirmed fixed
- [ ] Regression check completed
- [ ] No unrelated changes in the PR
- [ ] If the bug was data-corrupting: a data remediation script written and tested
- [ ] If the bug was security-related: security team notified, labeled `security`

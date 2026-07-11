# Feature Planning Prompt Template

Use this template when starting work on any new feature for Tutora. Work through each section before writing a single line of code. Incomplete planning is the leading cause of rework.

---

## Step 1 — Context to Gather

Before planning, answer these questions by reading existing code and documentation:

1. **Which module(s) does this feature touch?** (auth, users, tutors, students, search, applications, reviews, chat, notifications, payments, admin, media)
2. **Which repo(s) are involved?** (tutora / tutora-api / tutora-admin / tutora-web)
3. **Who are the affected user roles?** (Student / Tutor / Admin — or multiple)
4. **Does a similar pattern already exist in the codebase?** (Check existing features before designing from scratch)
5. **Are there any active PRs or branches that touch the same area?** (Avoid conflicts)
6. **What are the relevant data models?** (Review `prisma/schema.prisma`)
7. **Are there existing API endpoints that partially address this?** (Check Swagger / controllers)

---

## Step 2 — Questions to Answer (fill these in)

**Feature name:**

**One-sentence description:** What does this feature do and for whom?

**Why are we building it?** What user pain does it solve? Link to the Tutora problem statement if relevant.

**Out of scope:** What explicitly will NOT be built in this iteration?

**Dependencies:** Does this feature require another feature to be complete first?

**Risk level:** Low / Medium / High — and why.

---

## Step 3 — User Stories

Write one story per actor per distinct behavior. Use the format:

```
As a <role>,
I want to <action>,
so that <outcome / benefit>.
```

**Example:**

```
As a Student,
I want to filter tutors by district,
so that I only see tutors who are available in my area.
```

List all stories for this feature:

1.
2.
3.

---

## Step 4 — Acceptance Criteria

For each user story, write concrete, testable criteria.

```
Story: [title]
Given [initial context]
When  [user action]
Then  [observable outcome]
And   [additional outcome if needed]
```

List criteria for all stories. Be specific about:

- What the UI shows in each state (loading, empty, error, success)
- What data is returned or persisted
- What validations are enforced
- What notifications or side effects occur

---

## Step 5 — Affected Modules & Files

List every module and file that will be created or modified:

### Mobile (`tutora`)

- New files:
- Modified files:

### API (`tutora-api`)

- New files:
- Modified files:
- New Prisma models or fields:

### Admin (`tutora-admin`)

- New files:
- Modified files:

### Landing (`tutora-web`)

- New files:
- Modified files:

---

## Step 6 — API Contracts

Define every new or modified endpoint. For each:

```
Method:    POST
Path:      /applications
Auth:      Required (STUDENT role)
Request body:
  {
    "tutorId": "uuid",
    "subjectId": "uuid",
    "message": "string (optional, max 500 chars)",
    "preferredStartDate": "ISO 8601 date string"
  }
Response 201:
  {
    "id": "uuid",
    "status": "PENDING",
    "createdAt": "ISO 8601"
  }
Errors:
  400 — Invalid input
  404 — Tutor not found
  409 — Application already exists for this tutor+student pair
  429 — Rate limit exceeded
```

For each endpoint, also define:

- Cache behavior (cached? TTL? invalidation trigger?)
- Rate limiting requirements
- Background job triggered (if any)

---

## Step 7 — Database Changes

List all Prisma schema changes:

- New models:
- New fields on existing models:
- New indexes:
- New relations:
- Migration strategy: (can this run without downtime? does it require a backfill?)
- Rollback plan: (how to revert the migration if deployment fails)

**Flag any migration that:**

- Adds a NOT NULL column without a default (requires backfill)
- Drops a column or table
- Changes a column type
- Removes an index used by existing queries

---

## Step 8 — UI States

For each screen or component introduced by this feature, specify the visual and behavioral design for all five required states:

| State              | What the user sees                      | What triggers it          |
| ------------------ | --------------------------------------- | ------------------------- |
| Loading            | Skeleton shimmer (match content shape)  | Initial data fetch        |
| Empty              | [Illustration + message + optional CTA] | API returns empty array   |
| Error              | [Error message + Retry button]          | API request fails         |
| Success            | [Actual content]                        | Data loaded successfully  |
| Pagination loading | Inline spinner at list bottom           | User scrolls to last item |

Also specify:

- Navigation: where can the user come from, where can they go next?
- Bottom sheet usage (if any): snap points, dismissible?
- Modals: when shown, what triggers them, how dismissed?

---

## Step 9 — i18n Keys

List all new translation keys needed:

```json
{
  "<feature>.<component>.<key>": "English value",
  ...
}
```

Keys must be added to `az.json`, `en.json`, and `ru.json` before the feature is complete.

---

## Step 10 — Test Plan

### Unit Tests

- [ ] List each utility function and hook that needs a unit test.

### Integration Tests

- [ ] List each API endpoint that needs an integration test.

### E2E Tests

- [ ] Describe the happy-path E2E scenario to automate (Detox or Maestro).

### Manual Test Checklist

- [ ] iOS simulator
- [ ] Android emulator
- [ ] Dark mode
- [ ] Network error scenario
- [ ] VoiceOver / TalkBack

---

## Step 11 — Definition of Done Checklist

Confirm the feature meets all requirements in `.claude/context/project-rules.md#definition-of-done` before marking the work complete.

- [ ] All acceptance criteria met
- [ ] API contracts match implementation
- [ ] DB migration tested (up and down)
- [ ] i18n keys in all three locales
- [ ] All UI states implemented
- [ ] Dark mode works
- [ ] Accessibility: labels, contrast, tap targets
- [ ] Unit and integration tests pass
- [ ] CI green
- [ ] PR approved and merged to `develop`

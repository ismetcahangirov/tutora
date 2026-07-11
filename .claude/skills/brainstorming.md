# Brainstorming Skill — Tutora

## When to Use

Invoke this skill at the start of any non-trivial decision:

- New feature planning (e.g. "add a review system for tutors")
- Architecture discussions (e.g. "should sessions live in Postgres or Redis?")
- UX / product improvements (e.g. "improve the tutor-search flow")
- Database schema design (e.g. "model availability + booking conflicts")
- API design (e.g. "shape the `/sessions` endpoint contract")
- Any time two or more reasonable approaches exist and a choice must be made

Do NOT skip this for "small" tasks — many bugs and rework cycles come from insufficient upfront thinking on seemingly small decisions.

---

## Process

### Step 1 — Clarify the Problem

Before generating any ideas, sharpen the question. A vague problem produces vague solutions.

Questions to ask:

- What is the exact user pain or business need being solved?
- Who is the primary actor? (student, parent, tutor, admin, system)
- What does success look like — measurably?
- What is the MVP scope vs. nice-to-have?
- Are there hard constraints? (deadline, existing schema, API contracts, 3rd-party limits)
- What has already been tried or ruled out, and why?

Tutora examples:
- "Tutors need to mark availability" → Who sets it — tutor only, or admin too? Is it recurring or per-day? Does it need to handle time zones?
- "Build a messaging feature" → Real-time or async? Within existing booking context or standalone inbox?

---

### Step 2 — Explore Constraints

Surface non-negotiables before ideating. These eliminate entire branches of solutions.

Constraint categories:

| Category | Questions |
|---|---|
| Data model | What tables already exist? What relationships are fixed? |
| API contracts | Are mobile clients already calling an endpoint? Can we break it? |
| Auth / security | Which roles are involved? What data must be row-level secured? |
| Performance | What scale? Real-time? Offline support needed? |
| Design system | Does the UI touch already exist in shadcn/ui? No gradients, Plus Jakarta Sans. |
| Time | Is this MVP or full feature? What can be deferred? |

---

### Step 3 — Generate Multiple Options

Produce at least **3 meaningfully different options** — not minor variations. Push for genuine alternatives (e.g. different data models, different ownership of logic, different UX paradigms).

Format each option as:

```
Option A — [short label]
Description: ...
How it works: ...
Pros: ...
Cons: ...
Risk: ...
```

Tutora examples:

**Tutor availability — Option A:** Store recurring weekly slots in a `tutor_availability` table.
**Tutor availability — Option B:** Store exceptions only ("blocked" calendar entries), assume always available.
**Tutor availability — Option C:** Integrate a third-party scheduling API (Cal.com, Calendly).

---

### Step 4 — Evaluate Trade-offs

Score or rank each option across the dimensions that matter most for this specific decision. Common dimensions:

- Implementation complexity (dev days, dependencies)
- Maintainability (will the next engineer understand this in 6 months?)
- User experience quality
- Performance at scale
- Security surface area
- Reversibility (can we change it later without a migration?)

Use a simple table:

| Option | Complexity | UX | Reversibility | Notes |
|---|---|---|---|---|
| A | Low | Medium | High | Safe default |
| B | Medium | High | Medium | Better long-term |
| C | High | High | Low | Lock-in risk |

---

### Step 5 — Converge on a Recommendation

Pick one. State it plainly with a rationale sentence. If the decision is genuinely too close to call, surface the single deciding question and park it for the stakeholder.

Format:

```
Recommendation: Option B
Rationale: Lowest complexity for MVP scope, reversible if requirements change,
fits existing Prisma schema without a new migration.
Deferred: Recurring slot UI can be added in v2 without schema changes.
```

---

### Step 6 — Define Next Actions

Turn the decision into a concrete task list. Each item must have:

- An owner or role (dev, designer, PM, DBA)
- A deliverable (not an activity — "schema migration file" not "think about schema")
- A dependency noted if relevant

Example:

```
1. [Dev] Write Prisma migration for tutor_availability table
2. [Dev] Add NestJS service method getTutorAvailability(tutorId, weekOf)
3. [Dev] Add RLS policy: tutors can only read/write their own rows
4. [Dev] Mobile — wire AvailabilityScreen to new endpoint
5. [Design] Confirm time-slot picker component choice (existing or new)
```

---

## Checklist

- [ ] Problem is stated as a user need, not a solution
- [ ] Constraints are listed (schema, auth, time, scale)
- [ ] At least 3 distinct options generated
- [ ] Each option has pros, cons, and risk noted
- [ ] Trade-offs evaluated across relevant dimensions
- [ ] One option is recommended with a rationale
- [ ] Deferred / out-of-scope items are noted explicitly
- [ ] Next actions are concrete, ownable, and ordered by dependency

---

## Tutora-Specific Reminders

- **Auth**: Every data decision must account for Supabase RLS or NestJS RBAC guards. Ask "who can see/change this?" before schema design.
- **Mobile-first**: The primary user surface is React Native / Expo. API shape must be mobile-friendly (paginated, minimal payload).
- **Admin surface**: `tutora-admin` (React + Vite + shadcn/ui) needs consideration for every entity — can admins manage this?
- **No over-engineering**: Tutora is early-stage. Prefer reversible, simple options over clever ones. Choose boring technology.
- **Naming discipline**: Table names, endpoint names, and component names should be consistent and in English.

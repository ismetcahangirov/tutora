#!/usr/bin/env bash
# seed-issues.sh — Create the full Tutora epic / sub-issue tree with labels.
# Uses GitHub native sub-issues (GraphQL addSubIssue). Idempotency is NOT
# guaranteed — run once. Progress is logged to $LOG.
#
# NOTE: Epic #1 ("Project Setup & Infrastructure") and its first child
# ("Scaffold repositories…") were already created during a validation probe,
# so this script continues epic #1 from its second child.

REPO="ismetcahangirov/tutora"
LOG="/tmp/tutora-issues.log"
: > "$LOG"

CUR_EPIC_NUM=""
CUR_EPIC_ID=""
CREATED=0
LINKED=0
FAILED=0

_new() { # $1 title  $2 labels  $3 body -> "num id"
  local url num id
  url=$(gh issue create --repo "$REPO" --title "$1" --label "$2" --body "$3" 2>>"$LOG")
  num=$(printf '%s' "$url" | grep -oE '[0-9]+$')
  if [[ -z "$num" ]]; then echo "ERROR creating: $1" >>"$LOG"; FAILED=$((FAILED+1)); echo ""; return; fi
  id=$(gh issue view "$num" --repo "$REPO" --json id -q .id 2>>"$LOG")
  CREATED=$((CREATED+1))
  echo "$num $id"
}

epic() { # $1 title  $2 labels  $3 body
  local out; out=$(_new "$1" "$2" "$3")
  CUR_EPIC_NUM=$(echo "$out" | cut -d' ' -f1)
  CUR_EPIC_ID=$(echo "$out" | cut -d' ' -f2)
  echo "EPIC #$CUR_EPIC_NUM  $1" | tee -a "$LOG"
  sleep 2
}

child() { # $1 title  $2 labels  $3 scope-line
  local body out cnum cid
  body="Part of the epic #${CUR_EPIC_NUM}.

$3

Follow the standards in CLAUDE.md and .claude/context/. The Definition of Done in CLAUDE.md applies before this can be closed."
  out=$(_new "$1" "$2" "$body")
  cnum=$(echo "$out" | cut -d' ' -f1)
  cid=$(echo "$out" | cut -d' ' -f2)
  if [[ -n "$cid" ]]; then
    if gh api graphql -H "GraphQL-Features: sub_issues" \
        -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){subIssue{number}}}' \
        -f p="$CUR_EPIC_ID" -f c="$cid" >>"$LOG" 2>&1; then
      LINKED=$((LINKED+1)); echo "  #$cnum linked   $1" | tee -a "$LOG"
    else
      echo "  #$cnum ref-only $1" | tee -a "$LOG"
    fi
  fi
  sleep 2
}

# ── EPIC 1: continue (already created as #1, child #2 already exists) ─────────
CUR_EPIC_NUM=1
CUR_EPIC_ID="I_kwDOTVM1Rs8AAAABIceugQ"
echo "EPIC #1  Project Setup & Infrastructure (continuing)" | tee -a "$LOG"
child "Configure TypeScript, ESLint & Prettier across packages" "task,area: devops,priority: high" "Strict TypeScript, shared ESLint + Prettier config, no-any lint rules."
child "Set up Husky, lint-staged & commitlint (Conventional Commits)" "task,area: devops,priority: high" "Pre-commit lint/format on staged files; enforce Conventional Commit messages."
child "Configure absolute imports & path aliases" "task,area: devops,priority: medium" "Set up @/ aliases and barrel exports for every package."
child "Add Zod-based environment variable validation" "task,area: backend,area: security,priority: high" "Validate and type all env vars at startup; fail fast on misconfiguration."
child "Docker Compose for Postgres + Redis" "task,area: devops,priority: high" "Local dev stack: PostgreSQL 15 + Redis 7 with seed data."

# ── EPIC 2: Design System & UI Foundation ────────────────────────────────────
epic "🎨 Design System & UI Foundation" "epic,feature,area: ui,area: ux,priority: high" \
"**Epic.** Tutora design system: tokens, typography, and reusable components. Minimal, premium, NO gradients. See .claude/context/ui-guidelines.md."
child "Define color tokens (light + dark, no gradients)" "feature,area: ui,priority: high" "Implement the Tutora palette (Primary #4F46E5) as theme tokens for light and dark."
child "Implement typography scale (Plus Jakarta Sans)" "feature,area: ui,priority: high" "Load Plus Jakarta Sans (fallback Inter) and expose Display→Caption text styles."
child "Define spacing, radius & shadow tokens" "feature,area: ui,priority: high" "4pt spacing grid, radius scale, soft low-elevation shadows."
child "Build core components: Button, Input, Card" "feature,area: ui,priority: high" "Composable, variant-driven, accessible base components."
child "Build Bottom Sheet, Modal & Toast" "feature,area: ui,priority: medium" "Overlay primitives with gesture support and accessible focus handling."
child "Build Skeleton & loading states" "feature,area: ui,priority: medium" "Skeleton components and standardized loading/empty/error states."
child "Build Search & Filter components" "feature,area: ui,area: ux,priority: high" "Reusable search bar and filter sheet (district/subject/price/rating/online/language)."
child "Implement dark mode theming" "feature,area: ui,priority: medium" "System-aware theme switching across the app."

# ── EPIC 3: Authentication & Authorization ───────────────────────────────────
epic "🔐 Authentication & Authorization" "epic,feature,area: security,priority: high" \
"**Epic.** Google OAuth, JWT + refresh tokens, and role-based access (Student/Tutor/Admin). See README Authentication section."
child "Implement Google OAuth on backend" "feature,area: security,area: api,priority: high" "Verify Google ID tokens and provision/link user accounts."
child "JWT access + refresh token issuance" "feature,area: security,area: api,priority: high" "Short-lived access tokens and long-lived refresh tokens."
child "Refresh token rotation & revocation" "feature,area: security,area: api,priority: high" "Rotate refresh tokens on use; support revocation and reuse detection."
child "RBAC guards for Student/Tutor/Admin" "feature,area: security,area: backend,priority: high" "JwtAuthGuard + RolesGuard enforcing roles and permissions; fail closed."
child "Mobile Google sign-in + Secure Store" "feature,area: mobile,area: security,priority: high" "Native Google sign-in; persist tokens in Expo Secure Store."
child "Onboarding & role selection flow" "feature,area: mobile,area: ux,priority: high" "First-run onboarding and Student/Tutor role selection."
child "Axios interceptors for auto token refresh" "feature,area: mobile,area: api,priority: medium" "Transparent access-token refresh and retry on 401."

# ── EPIC 4: Backend API (tutora-api) ─────────────────────────────────────────
epic "🧩 Backend API (tutora-api)" "epic,feature,area: backend,priority: high" \
"**Epic.** NestJS + Prisma + Redis backend powering all Tutora clients. Feature-first modules, Swagger, rate limiting, caching."
child "Scaffold NestJS app with modules & Swagger" "feature,area: backend,area: api,priority: high" "Base app, config, global filters/pipes/interceptors, Swagger at /docs."
child "Design Prisma schema & initial migrations" "feature,area: database,priority: high" "Model users, tutors, students, subjects, districts, applications, reviews, chat, payments."
child "Users module" "feature,area: backend,priority: high" "User CRUD, profile, roles, account lifecycle."
child "Tutors module (profile, certificates)" "feature,area: backend,priority: high" "Tutor profiles, certificates, experience, languages, formats, pricing, verification state."
child "Students module" "feature,area: backend,priority: high" "Student profiles, preferences, favorites."
child "Search module with filters" "feature,area: backend,area: api,priority: high" "Filter tutors by district/subject/price/rating/online/language with pagination & indexes."
child "Applications module" "feature,area: backend,priority: high" "Student→tutor applications with status lifecycle."
child "Reviews & ratings module" "feature,area: backend,priority: medium" "Post-session reviews, ratings, and moderation hooks."
child "Chat module (realtime)" "feature,area: backend,priority: medium" "Realtime messaging between students and tutors."
child "Notifications module (Firebase push)" "feature,area: backend,priority: medium" "Push (Firebase) + in-app notifications with segmentation."
child "Payments & subscriptions module" "feature,area: backend,priority: low" "Subscription plans, entitlements, transactions."
child "Media upload module (Cloud Storage)" "feature,area: backend,priority: medium" "Signed uploads to Cloud Storage for avatars and certificates."
child "BullMQ jobs + Cron scheduler" "feature,area: backend,priority: medium" "Background jobs and scheduled tasks (digests, cleanups)."
child "Rate limiting & Redis caching" "feature,area: backend,performance,priority: medium" "Throttle auth endpoints; cache hot reads in Redis."

# ── EPIC 5: Mobile — Student Experience ──────────────────────────────────────
epic "📱 Mobile — Student Experience" "epic,feature,area: mobile,priority: high" \
"**Epic.** The student-facing mobile app: search, compare, favorite, chat, and review tutors. React Native + Expo."
child "Expo Router navigation & tab shell" "feature,area: mobile,priority: high" "Auth/student/tutor route groups and student tab navigator."
child "Home screen" "feature,area: mobile,area: ux,priority: high" "Discovery: featured tutors, categories, quick filters."
child "Tutor search with filters" "feature,area: mobile,area: ux,priority: high" "Debounced search + filter sheet (district/subject/price/rating/online/language)."
child "Tutor detail page" "feature,area: mobile,priority: high" "Certificates, experience, schedule, pricing, reviews, contact/apply."
child "Favorites" "feature,area: mobile,priority: medium" "Save and manage favorite tutors (persisted with MMKV)."
child "Tutor comparison (side-by-side)" "feature,area: mobile,area: ux,priority: medium" "Compare selected tutors across key attributes."
child "Chat UI" "feature,area: mobile,priority: medium" "Conversation list and message thread UI."
child "Write & read reviews" "feature,area: mobile,priority: medium" "Submit ratings/reviews and view others'."
child "Student profile & preferences" "feature,area: mobile,priority: medium" "Profile, saved filters, preferences, settings."
child "Push & in-app notifications" "feature,area: mobile,priority: medium" "Register for push (expo-notifications) and render in-app notifications."

# ── EPIC 6: Mobile — Tutor Experience ────────────────────────────────────────
epic "🧑‍🏫 Mobile — Tutor Experience" "epic,feature,area: mobile,priority: medium" \
"**Epic.** The tutor-facing mobile app: profile, schedule, pricing, applications, and statistics."
child "Tutor dashboard with statistics" "feature,area: mobile,priority: medium" "Profile views, applications, conversion, and rating stats."
child "Create & edit tutor profile" "feature,area: mobile,priority: high" "Profile builder: subjects, experience, languages, formats."
child "Certificate upload & verification status" "feature,area: mobile,area: security,priority: medium" "Upload certificates and track pending/verified/rejected status."
child "Schedule & availability management" "feature,area: mobile,priority: medium" "Define availability slots and lesson formats."
child "Pricing management" "feature,area: mobile,priority: medium" "Set pricing per subject/format."
child "Incoming applications management" "feature,area: mobile,priority: medium" "Review, accept, or decline student applications."
child "Subscription / plan management" "feature,area: mobile,priority: low" "Manage premium visibility plans."

# ── EPIC 7: Admin Panel (tutora-admin) ───────────────────────────────────────
epic "🖥️ Admin Panel (tutora-admin)" "epic,feature,area: admin,priority: high" \
"**Epic.** Enterprise admin panel: React + Vite + shadcn/ui with RBAC, moderation, CMS, and analytics."
child "Vite app shell, routing & RBAC layout" "feature,area: admin,priority: high" "Sidebar/topbar shell, protected routes, role/permission-aware navigation."
child "Dashboard & analytics" "feature,area: admin,priority: high" "KPIs, trends, and charts (Recharts)."
child "Users / Students / Tutors management" "feature,area: admin,priority: high" "Searchable tables (TanStack Table); view, suspend, edit, verify."
child "Verification requests review" "feature,area: admin,area: security,priority: high" "Approve/reject tutor certificates & identity with reasons."
child "Reviews & reports moderation" "feature,area: admin,priority: medium" "Moderate reviews and resolve abuse/spam reports."
child "Taxonomy management" "feature,area: admin,priority: medium" "CRUD for subjects, categories, districts, and languages."
child "Notifications & push composer" "feature,area: admin,priority: medium" "Compose, segment, schedule, and send notifications."
child "CMS (landing/FAQ/blog/media library)" "feature,area: admin,priority: medium" "Manage landing content, FAQ, blog posts, and media assets."
child "Payments & subscription plans" "feature,area: admin,priority: low" "Manage plans, entitlements, transactions, refunds."
child "Roles & permissions management" "feature,area: admin,area: security,priority: medium" "Fine-grained RBAC administration."
child "Feature flags & system settings" "feature,area: admin,priority: low" "Progressive rollout, kill switches, and global config."
child "Audit / error / security logs" "feature,area: admin,area: security,priority: medium" "Observability views for privileged actions and incidents."

# ── EPIC 8: Landing Page (tutora-web) ────────────────────────────────────────
epic "🌐 Landing Page (tutora-web)" "epic,feature,area: landing,priority: medium" \
"**Epic.** SEO-optimized single-page Next.js landing. Minimal, premium, NO gradients, high Lighthouse scores."
child "Next.js setup + design tokens + SEO baseline" "feature,area: landing,priority: high" "App Router, Tailwind, shared tokens, metadata scaffolding."
child "Hero, Problem/Solution & How It Works sections" "feature,area: landing,priority: high" "Above-the-fold value prop and core narrative."
child "Benefits (tutor + student) & platform stats" "feature,area: landing,priority: medium" "Audience-specific benefits and statistics."
child "App screens & testimonials" "feature,area: landing,priority: medium" "Screenshots showcase and user testimonials."
child "FAQ & blog preview" "feature,area: landing,priority: low" "FAQ accordion and latest blog posts preview."
child "CTA & footer" "feature,area: landing,priority: medium" "Primary call-to-action and footer with links."
child "SEO: metadata, OG, sitemap, structured data" "feature,area: landing,priority: high" "Open Graph, JSON-LD, sitemap.xml, robots.txt."
child "Lighthouse performance optimization" "feature,area: landing,performance,priority: medium" "Achieve ≥90 across Performance/A11y/Best-Practices/SEO."

# ── EPIC 9: Localization (i18n) ──────────────────────────────────────────────
epic "🌍 Localization (i18n)" "epic,feature,priority: medium" \
"**Epic.** Three languages: Azerbaijani (default), English, Russian. No hardcoded strings anywhere."
child "Mobile i18n setup (az/en/ru)" "feature,area: mobile,priority: high" "i18next + expo-localization; device-locale detection; MMKV persistence."
child "Admin & landing i18n setup" "feature,area: frontend,priority: medium" "i18next / next-intl with locale routing."
child "Backend nestjs-i18n (emails, validation)" "feature,area: backend,priority: medium" "Localized emails, notifications, and validation messages."
child "Translation key management in CMS" "feature,area: admin,priority: low" "Admin UI to edit translation keys per locale."

# ── EPIC 10: DevOps & CI/CD ──────────────────────────────────────────────────
epic "🚀 DevOps & CI/CD" "epic,task,area: devops,priority: medium" \
"**Epic.** Continuous integration, containerization, deployment, monitoring, and backups."
child "GitHub Actions: lint, typecheck & test" "task,area: devops,priority: high" "CI matrix across packages; block merges on failure."
child "Production Docker images & Compose" "task,area: devops,priority: medium" "Multi-stage images for api/admin/web."
child "Nginx reverse proxy configuration" "task,area: devops,priority: medium" "TLS termination and routing to services."
child "EAS build & OTA updates (expo-updates)" "task,area: devops,area: mobile,priority: medium" "EAS build profiles and over-the-air update channels."
child "Deployment pipelines (api/admin/web)" "task,area: devops,priority: medium" "Automated deploys with preview and production environments."
child "Monitoring & error tracking (Sentry)" "task,area: devops,priority: medium" "Error, performance, and uptime monitoring."
child "Database backups & restore" "task,area: devops,area: database,priority: medium" "Scheduled backups and tested restore procedure."

# ── EPIC 11: QA & Testing ────────────────────────────────────────────────────
epic "🧪 QA & Testing" "epic,testing,priority: medium" \
"**Epic.** Automated testing strategy across all surfaces. Bug fixes ship with regression tests."
child "Unit test setup across packages" "testing,priority: high" "Jest/Vitest + Testing Library configured everywhere."
child "API E2E tests (Supertest)" "testing,area: backend,priority: medium" "End-to-end coverage of core API flows."
child "Mobile E2E tests (Maestro)" "testing,area: mobile,priority: medium" "Critical mobile user journeys."
child "Web/Admin E2E tests (Playwright)" "testing,area: frontend,priority: medium" "Critical admin and landing journeys."
child "Critical-path coverage (auth/search/applications/payments)" "testing,priority: high" "Guarantee coverage on the highest-risk flows."

# ── EPIC 12: Documentation ───────────────────────────────────────────────────
epic "📄 Documentation" "epic,documentation,priority: low" \
"**Epic.** Keep project documentation complete and current. README and CLAUDE.md already exist."
child "API documentation (Swagger)" "documentation,area: api,priority: medium" "Complete, accurate Swagger/OpenAPI docs at /docs."
child "Contribution guide (CONTRIBUTING.md)" "documentation,priority: low" "How to set up, branch, commit, and open PRs."
child "Architecture & ADRs" "documentation,priority: low" "Architecture Decision Records for significant choices."
child "Onboarding guide for new developers" "documentation,priority: low" "Fast path from clone to first running build."

echo "" | tee -a "$LOG"
echo "=== SUMMARY: created=$CREATED linked=$LINKED failed=$FAILED ===" | tee -a "$LOG"

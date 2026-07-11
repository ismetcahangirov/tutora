# Release Prompt Template

Use this process for every production release of Tutora. A release touches multiple repos and delivery channels (mobile stores via Expo EAS, OTA updates via expo-updates, API deployment, admin panel deployment). Work through every section; do not skip steps even for patch releases.

---

## Release Types

| Type | Trigger | Version Bump |
|---|---|---|
| **Patch** | Bug fixes only; no new features; no DB migrations | `1.2.3 → 1.2.4` |
| **Minor** | New features added in a backward-compatible way | `1.2.3 → 1.3.0` |
| **Major** | Breaking API changes, major UI overhaul, significant workflow changes | `1.2.3 → 2.0.0` |
| **OTA-only** | JS-layer bug fix with no native changes; can be delivered without store submission | No version bump (use build number / OTA update ID) |

---

## Step 1 — Pre-Release Verification

Confirm the codebase is ready before starting the release process.

### Branch State
- [ ] All planned PRs for this release are merged to `develop`
- [ ] No PRs in "in-progress" state that were intended for this release
- [ ] `develop` CI is fully green (all checks pass)
- [ ] No known critical or high-priority bugs open for this release scope

### API / Database
- [ ] All database migrations are written, reviewed, and tested in staging
- [ ] Migrations are backward-compatible with the previous API version (or a cutover plan exists)
- [ ] New API endpoints are documented in Swagger
- [ ] Deprecated endpoints (if any) have been communicated to client teams

### Mobile
- [ ] All new features have been tested on a physical iOS device
- [ ] All new features have been tested on a physical Android device
- [ ] No native dependency changes require a new binary build (if OTA only)
- [ ] `expo-updates` channel is set correctly for the target environment
- [ ] Bundle identifier (`com.tutora.mobile`) and app display name (`Tutora`) are correct in `app.json`

---

## Step 2 — Version Bump

### API (`tutora-api`)

```bash
# On the release branch
npm version patch   # or minor / major
# This updates package.json and creates a git tag
```

### Mobile (`tutora`)

Update `app.json`:
```json
{
  "expo": {
    "version": "1.3.0",
    "ios": {
      "buildNumber": "42"   // increment by 1 each build
    },
    "android": {
      "versionCode": 42     // increment by 1 each build
    }
  }
}
```

### Admin (`tutora-admin`)

```bash
npm version patch   # or minor / major
```

### Commit the version bump

```
chore(release): bump version to v1.3.0
```

---

## Step 3 — Generate Changelog

Generate changelog from Conventional Commits since the last release tag.

```bash
# Install if not already present
npm install -g conventional-changelog-cli

# Generate changelog (appends to CHANGELOG.md)
conventional-changelog -p angular -i CHANGELOG.md -s -r 0 --tag-prefix v

# Or manually: get all commits since last tag
git log v1.2.3..HEAD --oneline --no-decorate
```

### Changelog Format

```markdown
## [1.3.0] — 2026-07-11

### Features
- **search:** Add district filter with multi-select support (#PR-42)
- **tutor-profile:** Add portfolio image upload (#PR-38)

### Bug Fixes
- **chat:** Fix message ordering on slow network connections (#PR-45)
- **auth:** Prevent duplicate refresh token requests on 401 (#PR-41)

### Performance
- **search:** Cache search results in Redis; p95 reduced from 280 ms to 45 ms (#PR-39)

### Breaking Changes
- None

### Database Migrations
- `20260711_add_district_to_tutors`: Adds `district` column to `tutors` table (non-breaking, nullable with default)
```

Review the changelog carefully:
- [ ] All user-facing features are listed
- [ ] All bug fixes relevant to users are listed
- [ ] Breaking changes are explicitly called out
- [ ] Database migrations listed

---

## Step 4 — QA Checklist

Test the full release candidate in the **staging environment** against the staging API.

### Authentication
- [ ] Registration (Student) — email + phone
- [ ] Registration (Tutor) — email + phone
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (error shown)
- [ ] Token refresh (wait for access token to expire or force a 401)
- [ ] Logout (session terminated, can no longer access protected routes)
- [ ] Google OAuth login (if implemented)

### Search & Discovery
- [ ] Search returns results for valid subject
- [ ] District filter applies correctly
- [ ] Price range filter applies correctly
- [ ] Rating filter applies correctly
- [ ] Online/offline filter applies correctly
- [ ] Language filter applies correctly
- [ ] Empty state shown when no results match
- [ ] Pagination loads next page correctly

### Tutor Profile
- [ ] Tutor profile displays all fields correctly
- [ ] Reviews section shows correctly
- [ ] "Apply" button visible and functional for students

### Applications
- [ ] Student submits application
- [ ] Tutor receives push notification
- [ ] Tutor accepts application — student notified
- [ ] Tutor rejects application — student notified
- [ ] Student can cancel pending application

### Chat
- [ ] Messages send and receive in real time
- [ ] Message history loads correctly on reopen
- [ ] Long messages display without overflow

### Notifications
- [ ] Push notifications arrive for all application state changes
- [ ] Notification tap opens the correct screen

### Profile
- [ ] Student can update profile
- [ ] Tutor can update profile and subjects
- [ ] Avatar upload works (image selected, uploaded, displayed)

### Localization
- [ ] Test in Azerbaijani (default)
- [ ] Test in English
- [ ] Test in Russian
- [ ] No missing translation keys (check for fallback keys showing raw i18n key strings)

### Accessibility
- [ ] Core flows navigable with VoiceOver (iOS) or TalkBack (Android)
- [ ] No focus traps

### Dark Mode
- [ ] All major screens tested in dark mode
- [ ] No white boxes or illegible text

---

## Step 5 — Database Migrations

For any release that includes database migrations:

```bash
# In staging — run and verify
npx prisma migrate deploy

# Check migration history
npx prisma migrate status

# Verify data integrity after migration
# Run your data validation queries here
```

- [ ] Migrations ran successfully in staging
- [ ] Application functions correctly after migration
- [ ] Rollback script prepared and tested (see Step 9)

**Migration deployment order for production:**
1. Deploy the new API version (it must be compatible with the old schema — use backward-compatible migrations)
2. Run migrations
3. Verify application health
4. (Optional) Run backfill scripts if needed

---

## Step 6 — Deploy the API (`tutora-api`)

```bash
# Merge develop → main via PR
# Tag the release
git tag v1.3.0
git push origin v1.3.0

# Deploy (via CI/CD pipeline or manually)
docker build -t tutora-api:v1.3.0 .
docker push registry/tutora-api:v1.3.0
# Deploy to production server via your deployment mechanism

# Run migrations on production
npx prisma migrate deploy

# Health check
curl https://api.tutora.az/health
```

- [ ] API deployed and responding
- [ ] `/health` endpoint returns 200
- [ ] Swagger docs updated at `/api/docs`
- [ ] Error rate normal (check logs)
- [ ] Latency normal (check monitoring)

---

## Step 7 — OTA Update (expo-updates)

For JS-only changes that do not require new native binaries (most feature releases):

```bash
# Publish OTA update to the production channel
eas update --channel production --message "v1.3.0: search district filter, portfolio upload"
```

- [ ] OTA update published successfully
- [ ] Update ID logged for rollback reference
- [ ] Verify update is received on a test device within 5 minutes
- [ ] Smoke test the updated feature on the OTA-updated app

**When OTA is NOT sufficient (requires store build):**
- New native dependencies added (e.g., new Expo module with native code)
- Changes to `app.json` (version, bundle ID, permissions)
- Changes to `ios/` or `android/` directories
- Upgrade to a new Expo SDK version

---

## Step 8 — Store Submission (when a new binary is required)

### Build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Submit

```bash
# iOS — submit to App Store Connect
eas submit --platform ios --latest

# Android — submit to Google Play Console
eas submit --platform android --latest
```

### Store Submission Notes

**iOS (App Store):**
- Update "What's New" text in App Store Connect (in Azerbaijani, English, Russian)
- Screenshots: update if major UI changes
- Review notes: explain any new permissions requested
- Phased release: enable phased release (7 days) for all releases except critical hotfixes

**Android (Google Play):**
- Update release notes in all three languages
- Review target API level compliance
- Phased rollout: start at 10%, monitor crash rate, expand to 100% over 3–5 days

**Review preparation:**
- [ ] All new permissions have a clear justification
- [ ] No test accounts or debug features accessible in the production build
- [ ] Privacy policy updated if new data is collected
- [ ] App does not reference other platforms (Apple Review guideline 2.3.10)

---

## Step 9 — Rollback Plan

Prepare rollback steps before deploying, not after something goes wrong.

### API Rollback

```bash
# Roll back to previous Docker image
docker pull registry/tutora-api:v1.2.3
# Redeploy previous version via your deployment mechanism

# If migration was applied, run the down migration
npx prisma migrate resolve --rolled-back <migration-name>
# Then apply the rollback SQL manually if needed
```

### OTA Rollback

```bash
# Roll back to previous OTA update
eas update:rollback --channel production --group <previous-update-group-id>
```

### Store Build Rollback
- iOS: halt phased release, or push a new expedited build (App Store does not support binary rollback)
- Android: use Google Play Console to halt the rollout and re-activate the previous release

### Decision Criteria for Rollback

Roll back immediately if any of the following occur within 1 hour of deployment:
- Error rate increases by > 5% above pre-release baseline
- p95 API latency exceeds 2× pre-release baseline
- App crash rate exceeds 1% of sessions
- Any data corruption or data loss detected
- Authentication is broken for any user role

---

## Step 10 — Post-Release

- [ ] Release tag pushed to GitHub: `git tag v1.3.0 && git push origin v1.3.0`
- [ ] Release created on GitHub with the changelog as the description
- [ ] Merge `main` back into `develop` (to capture the version bump commit)
- [ ] Internal team notified (Telegram/Slack channel) with release summary
- [ ] Monitor error rate and latency for 24 hours post-release
- [ ] Monitor crash rate in Sentry / EAS Dashboard for 48 hours
- [ ] Close all GitHub issues resolved by this release
- [ ] Milestone closed on GitHub

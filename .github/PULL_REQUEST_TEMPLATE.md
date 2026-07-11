## Summary

<!-- Describe what this PR does and why. Keep it concise — one paragraph is ideal. -->

## Related Issues

<!-- Link every issue this PR addresses. GitHub auto-closes them on merge when you use "Closes". -->

Closes #

## Type of Change

<!-- Check all that apply. -->

- [ ] `feat` — New feature (non-breaking change that adds functionality)
- [ ] `fix` — Bug fix (non-breaking change that resolves an issue)
- [ ] `refactor` — Code change that neither fixes a bug nor adds a feature
- [ ] `docs` — Documentation only changes
- [ ] `test` — Adding or updating tests
- [ ] `style` — Formatting, whitespace, missing semicolons — no logic change
- [ ] `build` — Changes to build system or external dependencies
- [ ] `ci` — Changes to CI/CD configuration or scripts
- [ ] `perf` — A code change that improves performance
- [ ] `chore` — Maintenance tasks (deps bump, config, tooling)

## Area

<!-- Check all that apply. -->

- [ ] Mobile (React Native / Expo)
- [ ] Backend / API (NestJS — `tutora-api`)
- [ ] Admin Panel (React + Vite — `tutora-admin`)
- [ ] Landing Page (Next.js — `tutora-web`)
- [ ] Infrastructure / DevOps
- [ ] Database / Migrations
- [ ] Shared / Cross-cutting

## Screenshots / Recordings

<!-- For UI changes, attach before/after screenshots or a short screen recording.
     Delete this section if not applicable. -->

| Before | After |
|--------|-------|
|        |       |

## How Has This Been Tested?

<!-- Describe how you verified the change works. -->

- [ ] Manual testing on device / emulator / browser
- [ ] Unit tests
- [ ] Integration / E2E tests
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web

**Test environment:**

- OS / Device: 
- App version: 
- Node version: 

## Checklist

<!-- Go through every item. PRs that skip checklist items will be asked to address them. -->

- [ ] Lint passes (`npm run lint` / `yarn lint`)
- [ ] TypeScript types pass (`npm run typecheck` / `tsc --noEmit`)
- [ ] All existing tests pass
- [ ] New tests added for new functionality / bug fix
- [ ] No `console.log` / `console.error` left in production code
- [ ] User-facing strings use i18n keys — no hardcoded text in UI
- [ ] No hardcoded color gradients — using design tokens / theme
- [ ] Accessibility checked (ARIA labels, contrast, touch target size)
- [ ] Relevant documentation / comments updated
- [ ] PR title follows Conventional Commits (`type(scope): description`)

## Definition of Done

- [ ] All checklist items above are satisfied
- [ ] At least one approving review from a code owner
- [ ] CI pipeline is green (lint, type-check, tests, build)
- [ ] No unresolved review comments
- [ ] Linked issue(s) updated / closed

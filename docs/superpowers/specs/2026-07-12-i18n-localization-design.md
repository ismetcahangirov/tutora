# Localization (i18n) — Design (Epic #81)

**Status:** Approved · **Date:** 2026-07-12 · **Branch:** `feature/i18n-localization`

Delivers three of the epic's four sub-issues in one PR: **#82** (mobile), **#83**
(admin + landing), **#84** (backend + mailer). **#85** (DB-backed translation CMS)
is deferred to a fast-follow because it needs a `Translation` model, CRUD API, and
admin auth/routing/query-client — a feature in its own right. Catalogs are shaped so
a DB override can layer on later.

## Goals

- Three languages everywhere: **Azerbaijani (`az`, default/fallback)**, English
  (`en`), Russian (`ru`).
- No hardcoded user-facing strings in the real feature surfaces (the mobile
  `home.tsx` design-system showcase is throwaway dev demo and is out of scope).
- Static JSON catalogs per app (no runtime DB dependency).

## Shared conventions

- Namespaced dot keys: `auth.signIn.title`, `validation.role.invalid`,
  `mail.welcome.subject`.
- Every app ships a **catalog-integrity test**: all locales must expose the exact
  same set of keys (guards against a missing/forgotten translation).

## #82 Mobile — `apps/tutora`

Stack: `i18next` + `react-i18next` + `expo-localization` + `react-native-mmkv`.

- `src/shared/i18n/`: `locales/{az,en,ru}.json`, `config.ts` (i18next init,
  `fallbackLng: 'az'`, synchronous init so tests need no `await`),
  `detect-language.ts` (MMKV stored choice → device locale via `expo-localization`
  → `az`), `storage.ts` (thin MMKV wrapper, swappable), `use-language.ts`
  (`language` + `setLanguage` persisting to MMKV), `I18nProvider`, `index.ts` barrel.
- `_layout.tsx`: `I18nProvider` inserted right after `SafeAreaProvider` so auth and
  onboarding screens translate.
- Migrate real copy to keys: `AUTH_COPY`, `ONBOARDING_COPY`, `ONBOARDING_SLIDES`,
  `ROLE_OPTIONS`, welcome screen. Add a `LanguageSwitcher` (az/en/ru) on the welcome
  screen.
- Tests: `test-utils` gains a `language` option; catalog-integrity test; a screen
  renders translated text; switching language persists. `react-native-mmkv` mocked
  in `jest-setup`.
- **Consequence:** MMKV is a native module → the app now requires a dev build
  (`expo prebuild`/dev-client), not Expo Go. Matches the documented architecture
  ("persistence via MMKV") and issue #82. Wrapped so it stays swappable.

## #83 Admin (`apps/tutora-admin`, Vite) + Landing (`apps/tutora-web`, Next.js)

**Admin:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`
(localStorage → navigator → `az`). `src/shared/i18n/` config + catalogs, provider in
`main.tsx`, `LanguageSwitcher`, existing strings localized. Minimal **vitest** with a
catalog-integrity test.

**Landing:** **next-intl** with `[locale]` routing — `src/i18n/{routing,request}.ts`,
`middleware.ts`, `messages/{az,en,ru}.json`, `createNextIntlPlugin` in
`next.config.ts`, page moved under `src/app/[locale]/`, `<html lang={locale}>`,
localized metadata, default locale `az`. Minimal **vitest** catalog-integrity test.

## #84 Backend — `apps/tutora-api`

Stack: `nestjs-i18n` **+ a real mailer** (`nodemailer`).

- `src/i18n/{az,en,ru}/{common,validation,mail}.json`; `I18nModule.forRoot` with
  `fallbackLanguage: 'az'`, resolvers
  `[QueryResolver(['lang']), AcceptLanguageResolver, HeaderResolver(['x-lang'])]`.
- Validation: `i18nValidationErrorFactory` + global `I18nValidationExceptionFilter`
  mapped to the documented error envelope; `UpdateMeDto`/`GoogleAuthDto` messages
  converted to `i18nValidationMessage` keys.
- **Mailer:** `src/modules/mail/` — `MailService` on `nodemailer`, transport from env
  (`SMTP_*`, optional; falls back to a dev/log transport when unset so it never
  crashes locally). Localized subject/body via `I18nService`. Concrete use:
  fire-and-forget **localized welcome email** on new-user creation in the user's
  stored `locale` (`az` fallback), errors logged, never blocks signup. Env additions
  validated in the existing zod `env.ts`.
- No Prisma migration — `User.locale` already exists.
- Tests: `mail.service.spec` (localized content + transport called + graceful when
  unconfigured); i18n validation integration test (`?lang=ru` → Russian message);
  catalog-integrity test.

## Delivery

One branch `feature/i18n-localization`, one PR closing #82/#83/#84 and referencing
epic #81. Conventional Commits. `pnpm lint` / `typecheck` / `test` green on affected
apps.

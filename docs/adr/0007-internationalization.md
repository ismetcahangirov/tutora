# ADR-0007: First-class internationalization (az/en/ru)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Tutora core team

## Context

Tutora launches in Azerbaijan, where users read **Azerbaijani**, **Russian**, and
**English**. Localization cannot be an afterthought bolted on later — every
surface (mobile, admin, landing) and the API's validation/error messages must be
translatable, and content editors need to manage copy without a deploy.

## Decision

We will treat internationalization as a first-class concern across the whole
platform, with **`az` as the default and fallback**, plus `en` and `ru`.

- **Mobile** uses `i18next` / `react-i18next`; the device locale is detected and
  narrowed to a supported language, with a manual switcher.
- **Landing** uses `next-intl` with locale-segmented routing.
- **API** localizes validation and error messages per request.
- Keys are **dot-namespaced** (`search.filter.district`); no hardcoded user-facing
  strings anywhere. Translation catalogs can be edited from the **admin CMS**
  (a `Translation` model backs the editor).

Alternatives rejected: **English-only with later i18n** (a costly, error-prone
retrofit given our market) and **hardcoded per-locale screens** (unmaintainable,
untranslatable by non-developers).

## Consequences

- Adding or correcting copy is a data change, not a code change, for CMS-managed
  strings.
- A consistent key convention makes missing-translation detection and review
  straightforward.
- New user-facing features must add keys for all three languages as part of the
  Definition of Done.
- Cost: every surface carries an i18n runtime and catalogs, and contributors must
  keep the three locales in parity.

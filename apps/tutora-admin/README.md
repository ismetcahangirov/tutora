# Tutora Admin (`@tutora/admin`)

Enterprise admin panel for Tutora — React + Vite SPA with RBAC, moderation, CMS,
and analytics (epic [#59](https://github.com/)).

## Stack

- **React 19** + **Vite** + **TypeScript** (strict)
- **Tailwind CSS v4** with design tokens mirroring the mobile design system
  (indigo primary on soft slate neutrals — no gradients); shadcn-style primitives
- **React Router v7** (data router) with protected, permission-aware routes
- **TanStack Query** (server state) · **Zustand** (session + theme)
- **i18next** (az / en / ru) · Google-OAuth sign-in (admins only)

## Architecture

Feature-first with a Clean-Architecture dependency direction (`app → features → shared`):

```
src/
├── app/          composition root — providers, layout (shell), navigation, router, pages
├── features/
│   └── auth/     Google sign-in, session store, RBAC guards
└── shared/       ui (primitives), lib (api client + cn), rbac, theme, i18n, components, config
```

- **Auth** is Google-OAuth only; the panel is ADMIN-only and fails closed.
- **RBAC** gates navigation and routes on _permissions_ (not the raw role), so
  fine-grained, backend-driven permissions ([#69](https://github.com/)) can slot
  in without touching call sites.
- The shared **api client** attaches the access token and transparently refreshes
  on 401 (single-flight).

## Environment

Client env is validated with Zod (`src/shared/config/env.ts`); both vars are
optional with safe defaults:

| Variable                | Description                          | Default                 |
| ----------------------- | ------------------------------------ | ----------------------- |
| `VITE_API_URL`          | Base URL of the Tutora API           | `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for admin SSO | _(empty)_               |

## Scripts

```bash
pnpm --filter @tutora/admin dev        # start the dev server
pnpm --filter @tutora/admin build      # typecheck + production build
pnpm --filter @tutora/admin lint       # eslint
pnpm --filter @tutora/admin typecheck  # tsc --noEmit
pnpm --filter @tutora/admin test       # vitest
```

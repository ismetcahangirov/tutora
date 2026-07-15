# Monitoring & error tracking (Sentry)

Error, performance, and release monitoring across all four Tutora surfaces
(issue #92). Every integration is **fail-soft**: with no DSN configured the
Sentry SDK is never initialized, so local dev, tests, and CI run untouched.

## Surfaces

| Surface                | SDK                    | DSN variable                     | Where it initializes                                      |
| ---------------------- | ---------------------- | -------------------------------- | --------------------------------------------------------- |
| API (`tutora-api`)     | `@sentry/nestjs`       | `SENTRY_DSN` (server)            | `src/instrument.ts` (imported first in `main.ts`)         |
| Admin (`tutora-admin`) | `@sentry/react`        | `VITE_SENTRY_DSN` (build)        | `src/shared/observability/sentry.ts` → `main.tsx`         |
| Web (`tutora-web`)     | `@sentry/nextjs`       | `NEXT_PUBLIC_SENTRY_DSN` (build) | `src/instrumentation*.ts` → shared `initSentry`           |
| Mobile (`tutora`)      | `@sentry/react-native` | `EXPO_PUBLIC_SENTRY_DSN` (build) | `src/shared/observability/sentry.ts` → root `_layout.tsx` |

Each surface should use its **own Sentry project** so issues, releases, and
quotas stay separated.

## How each integration works

- **API** — `instrument.ts` calls `Sentry.init()` before any other module loads
  (so auto-instrumentation can patch dependencies). `SentryModule.forRoot()` is
  registered in `AppModule` for request isolation + tracing, and the existing
  catch-all `AllExceptionsFilter` reports **unexpected 5xx** failures via
  `Sentry.captureException` (4xx client errors are treated as noise).
- **Admin** — `initSentry()` runs before React mounts; the router `errorElement`
  (`RootErrorPage`) forwards uncaught render/loader errors to Sentry.
- **Web** — `instrumentation.ts` loads the server/edge config and exports
  `onRequestError`; `instrumentation-client.ts` initializes the browser SDK and
  exports `onRouterTransitionStart`. `next.config.ts` is wrapped with
  `withSentryConfig` for build-time source-map upload.
- **Mobile** — `initSentry()` runs at module load in the root layout, which is
  wrapped in `Sentry.wrap(...)` to capture render errors and navigation
  breadcrumbs. Source maps upload during `eas build` (see
  [mobile-releases.md](mobile-releases.md)).

## Configuration

### Local / dev

Leave every DSN empty (the defaults in `.env.example`). Sentry stays disabled.

### Production

Server-side (API) — set in the host `.env` (injected via `env_file`):

```dotenv
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
SENTRY_ENVIRONMENT=production
```

Client bundles (admin, web) inline their **public** DSN at **build time**, so
they are passed as Docker build args. With `docker-compose.prod.yml`, set them
in the host `.env`:

```dotenv
ADMIN_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<admin-project>
WEB_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<web-project>
```

In the GHCR deploy pipeline (`.github/workflows/deploy.yml`) they come from the
repository **variables** `ADMIN_SENTRY_DSN` and `WEB_SENTRY_DSN`. Because
`NEXT_PUBLIC_*` is inlined into both the server and client bundles, the single
web build arg covers both runtimes.

### Source maps

- **Web** — uploaded by `withSentryConfig` during `next build` when
  `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are present in the
  build environment. Without them the build proceeds and simply skips upload.
- **Mobile** — uploaded by the `@sentry/react-native/expo` plugin during
  `eas build` when `SENTRY_ORG` / `SENTRY_PROJECT` are configured and the
  `SENTRY_AUTH_TOKEN` EAS secret is set.

> The `@sentry/cli` binary (used for source-map upload) is intentionally **not**
> built on install (`allowBuilds` in `pnpm-workspace.yaml`): CI does not upload
> maps, and the deploy/EAS environments handle it with their own auth token.

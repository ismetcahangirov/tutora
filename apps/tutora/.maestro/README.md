# Mobile E2E — Maestro flows (issue #97)

End-to-end UI journeys for the Tutora mobile app, written with
[Maestro](https://maestro.mobile.dev). Flows are declarative YAML that drive a
real build of the app on an Android emulator or iOS simulator.

## What's covered

The committed suite exercises the **signed-out onboarding surface** — the part
of the app that renders without a backend, so the flows are deterministic and
free of test-data setup:

| Flow                              | Journey                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `onboarding/welcome.yaml`         | First-run screen shows the brand, first slide and Google CTA |
| `onboarding/carousel.yaml`        | Swiping pages through all three value-proposition slides     |
| `onboarding/language-switch.yaml` | The az / en / ru switcher re-localizes the UI live           |
| `auth/sign-in.yaml`               | The `tutora://sign-in` deep link opens the re-auth screen    |

`common/launch-onboarding.yaml` is a shared building block (a clean launch with
the UI pinned to English); it is pulled into each journey with `runFlow` and is
not discovered as a standalone test.

Flows select elements by `testID` where a stable anchor matters
(`welcome-screen`, `onboarding-carousel`, `google-signin-button`,
`sign-in-screen`, `language-{az,en,ru}`) and by visible text for content
assertions.

> **Authenticated journeys** (search, applications, chat, subscription) require a
> seeded backend and a real Google session, so they are intentionally out of this
> suite. Add them under a new folder tagged separately (e.g. `journey`) once a
> staging API and a test account are available — see _Extending_ below.

## Prerequisites

1. **Maestro CLI** on your `PATH`:
   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   ```
2. A running **Android emulator** or **iOS simulator**.
3. A **build of the app installed** on that device. Maestro drives an installed
   binary — it does not use Expo Go. Produce one with a native debug build:
   ```bash
   pnpm --filter @tutora/mobile exec expo prebuild --platform android
   (cd apps/tutora/android && ./gradlew :app:assembleDebug)
   adb install -r apps/tutora/android/app/build/outputs/apk/debug/app-debug.apk
   ```
   or an EAS `development`/`preview` build.

## Running

From the app directory (`apps/tutora`):

```bash
# All discovered flows
pnpm test:e2e

# Smoke subset only
pnpm test:e2e:smoke

# Author/inspect flows interactively
pnpm e2e:studio
```

Each script passes the app id to the flows (`-e APP_ID=com.tutora.mobile`, the
value declared in `app.json`). Every flow header reads `appId: ${APP_ID}`, so to
run against a different build just override it:

```bash
maestro test -e APP_ID=com.tutora.other .maestro
```

## Continuous integration

Mobile E2E is **not** part of the required PR gates: it needs an emulator and a
native build, which are far heavier than the browser/API E2E in
[`e2e.yml`](../../../.github/workflows/e2e.yml). The
[`mobile-e2e.yml`](../../../.github/workflows/mobile-e2e.yml) workflow builds a
debug APK and runs the smoke tags on an Android emulator; trigger it on demand
from the **Actions** tab (or wire it to a nightly schedule).

## Extending

- Group new journeys in a feature folder (`search/`, `applications/`, …) and add
  the folder to `flows:` in `config.yaml`.
- Tag long, backend-dependent journeys (e.g. `- journey`) so the fast `smoke`
  run stays green, and select them with `--include-tags journey`.
- Prefer `testID` anchors over copy for anything that can change with locale or
  design; add the `testID` to the component and reference it with `id:`.
- Keep credentials and environment specifics out of the flows — pass them with
  `-e KEY=value` at runtime.

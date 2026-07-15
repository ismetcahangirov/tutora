# Mobile builds & OTA updates (EAS)

How the Tutora mobile app is built and updated over the air (issue #90). Builds
and updates run through [EAS](https://docs.expo.dev/eas/) using the profiles in
`apps/tutora/eas.json`.

## Build profiles (`eas.json`)

| Profile       | Distribution | Channel       | Notes                                 |
| ------------- | ------------ | ------------- | ------------------------------------- |
| `development` | internal     | `development` | Dev client build for debugging.       |
| `preview`     | internal     | `preview`     | Internal QA / stakeholder testing.    |
| `production`  | store        | `production`  | Store submission; `autoIncrement` on. |

`cli.appVersionSource` is `remote`, so EAS owns the build number / version code
and increments it for production builds.

## Over-the-air updates (`expo-updates`)

Updates are wired through `app.config.ts`:

- **`runtimeVersion: { policy: 'appVersion' }`** — an update is only served to a
  build whose app version matches, so a JS bundle never lands on an incompatible
  native binary.
- **`updates.url`** — derived from `EAS_PROJECT_ID` (`https://u.expo.dev/<id>`),
  set once `eas init` has assigned the project.
- Each build profile pins a **channel**, so `development` / `preview` /
  `production` builds each pull updates from their own stream.

At runtime, `useOtaUpdates()` (in the root layout) re-checks for an update
whenever the app returns to the foreground and reloads if one is available. It is
a no-op in dev and Expo Go (`Updates.isEnabled` is `false` there), so it only
runs in release builds.

## First-time setup

The repo ships everything except the account-specific project id, which is
assigned by EAS:

```bash
cd apps/tutora
eas init            # creates the EAS project, writes extra.eas.projectId
eas update:configure # confirms updates.url + runtimeVersion
```

`app.config.ts` reads `EAS_PROJECT_ID` from the environment, so CI/local builds
without an EAS project simply skip the update URL — nothing to hardcode.

## Commands

```bash
# Native builds
eas build --profile development --platform android
eas build --profile preview --platform all
eas build --profile production --platform all

# Ship an OTA update to a channel (no store review needed)
eas update --channel preview --message "Fix search filter"
eas update --channel production --message "Copy tweaks"

# Store submission
eas submit --profile production --platform all
```

## Crash reporting & source maps

Sentry is initialized in the app (see [monitoring.md](monitoring.md)). The
`@sentry/react-native/expo` plugin uploads source maps during `eas build` when
`SENTRY_ORG` / `SENTRY_PROJECT` are set and a `SENTRY_AUTH_TOKEN` EAS secret
exists:

```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value <token>
```

Set the per-profile `EXPO_PUBLIC_SENTRY_ENVIRONMENT` (already wired in
`eas.json`) so events are tagged development / preview / production.

# Mobile Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Android release APKs from GitHub Actions (no EAS Build), publish
JS-only changes as free EAS Update OTA updates, and replace the app's silent
background-reload hook with a visible update prompt (progress bar, graceful
restart).

**Architecture:** A new `mobile-release.yml` workflow runs a `fingerprint` job
that decides whether native code changed since the last release; an
`ota-update` job always publishes to EAS Update; a conditional `build-apk` job
regenerates the native Android project (`expo prebuild`), signs it with a
CI-held keystore via a small local config plugin, and uploads the APK to
GitHub Releases. On-device, `expo-updates`' official `useUpdates()` hook
drives a new `UpdatePromptModal` (Yenilə/Sonra → progress bar → branded
restart overlay), replacing the current `useOtaUpdates` silent-reload hook.

**Tech Stack:** Expo SDK 57 (`expo-updates` ~57.0.6), `@expo/fingerprint`,
`@expo/config-plugins` (already transitive via `expo`), `eas-cli` /
`expo/expo-github-action@v8`, GitHub Actions, Jest + `@testing-library/react-native`.

**Reference spec:** `docs/superpowers/specs/2026-07-19-mobile-release-pipeline-design.md`

---

## Before Task 1: what you (the human) must do first

Task 1 cannot start until:

1. You've created a free account at https://expo.dev.
2. You've told the agent/engineer you're ready, so they can run `eas login`
   interactively with you watching (it opens a browser / asks for
   email+password — the agent cannot do this alone).

If this hasn't happened yet, stop here and do it before Task 1.

---

### Task 1: Link the project to EAS Update

**Files:**

- Modify: `apps/tutora/app.json`

- [ ] **Step 1: Log in to EAS**

Run (interactively, in a real terminal — this opens a login prompt):

```bash
cd apps/tutora
npx eas-cli login
```

Expected: prints `Logged in as <your-username>`.

- [ ] **Step 2: Configure the project for EAS Update**

```bash
npx eas-cli update:configure
```

Expected output includes something like `Created EAS project <owner>/tutora`
and a confirmation that `app.json` was updated. This command **writes**
`runtimeVersion`, `updates.url`, and `extra.eas.projectId` into
`apps/tutora/app.json` for you — do not hand-edit those three fields, only
verify they now exist.

- [ ] **Step 3: Verify and check in the resulting app.json**

```bash
cat apps/tutora/app.json
```

Confirm it now contains an `updates.url` (starts with
`https://u.expo.dev/`) and `extra.eas.projectId`. If `runtimeVersion` was set
to anything other than `{"policy": "fingerprint"}` (e.g. `{"policy":
"sdkVersion"}`, which is the CLI's default), edit it by hand now:

```json
"runtimeVersion": { "policy": "fingerprint" },
```

- [ ] **Step 4: Set the update channel**

Add this key to the top-level `expo` object in `apps/tutora/app.json` (this is
what makes a manually-built APK announce itself as being on the `production`
channel, since we never run `eas build`, which is what would normally set this
for you):

```json
"updates": {
  "url": "https://u.expo.dev/<the-projectId-from-step-2>",
  "requestHeaders": {
    "expo-channel-name": "production"
  }
}
```

(Merge this into the `updates` key `eas init` already created — don't
duplicate the key.)

- [ ] **Step 5: Commit**

```bash
git add apps/tutora/app.json
git commit -m "feat(mobile): link project to EAS Update, set fingerprint runtime + production channel"
```

- [ ] **Step 6: Create the CI access token**

At https://expo.dev → your account → Access Tokens → "Create token". Copy it.
**Do not paste it into chat** — go straight to step 7.

- [ ] **Step 7: Store it as a GitHub secret (you run this, not the agent)**

```bash
gh secret set EXPO_TOKEN
```

(It will prompt for the value on stdin — paste the token there, not on the
command line, so it never lands in shell history.)

---

### Task 2: Generate the release keystore

**Files:**

- Create (locally only, never committed): `apps/tutora/release.keystore`

- [ ] **Step 1: Generate the keystore**

```bash
cd apps/tutora
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias tutora-release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$(openssl rand -base64 24)" \
  -keypass "$(openssl rand -base64 24)" \
  -dname "CN=Tutora, OU=Mobile, O=Tutora, L=Baku, ST=Baku, C=AZ"
```

Do **not** reuse `openssl rand` output silently — capture the two generated
passwords into variables first so you can also use them in Step 3:

```bash
cd apps/tutora
STORE_PASS="$(openssl rand -base64 24)"
KEY_PASS="$(openssl rand -base64 24)"
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias tutora-release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Tutora, OU=Mobile, O=Tutora, L=Baku, ST=Baku, C=AZ"
```

Expected: `Generating 2,048 bit RSA key pair...` then a `[Storing
release.keystore]` line, and `release.keystore` exists in `apps/tutora/`.

- [ ] **Step 2: Confirm it's git-ignored**

```bash
git check-ignore apps/tutora/release.keystore
```

Expected: prints the path (confirming it's ignored). If it prints nothing,
STOP and add `release.keystore` to `apps/tutora/.gitignore` before continuing
— this file must never be committed.

- [ ] **Step 3: Upload as GitHub secrets**

> **Pause here and confirm with the user before running this** — it writes
> the signing credentials for the shipped app into the shared GitHub repo.
> Do not run silently.

```bash
cd apps/tutora
base64 -w0 release.keystore | gh secret set ANDROID_KEYSTORE_BASE64
echo -n "$STORE_PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD
echo -n "tutora-release" | gh secret set ANDROID_KEY_ALIAS
echo -n "$KEY_PASS" | gh secret set ANDROID_KEY_PASSWORD
```

- [ ] **Step 4: Verify the secrets exist**

```bash
gh secret list
```

Expected: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `EXPO_TOKEN` all listed.

- [ ] **Step 5: Back up the keystore somewhere durable**

Copy `apps/tutora/release.keystore` to a password manager or secure offline
location **right now**. If this file is lost and no GitHub secret backup is
kept elsewhere, no future release can ever update an existing install again
— every user would need to uninstall and reinstall. This step has no "commit"
— it's a manual backup, not a repo change.

---

### Task 3: `withReleaseSigning` config plugin

**Files:**

- Create: `apps/tutora/plugins/withReleaseSigning.js`
- Test: `apps/tutora/plugins/__tests__/withReleaseSigning.test.js`
- Modify: `apps/tutora/app.json`

The generated `android/app/build.gradle` (confirmed by inspecting the
already-prebuilt local copy) currently contains:

```groovy
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            ...
```

- [ ] **Step 1: Write the failing test**

Create `apps/tutora/plugins/__tests__/withReleaseSigning.test.js`:

```js
const { patchBuildGradle } = require('../withReleaseSigning');

const FIXTURE = `android {
    namespace 'com.tutora.mobile'
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            minifyEnabled enableMinifyInReleaseBuilds
        }
    }
}
`;

describe('patchBuildGradle', () => {
  it('adds a release signingConfig reading from env vars', () => {
    const result = patchBuildGradle(FIXTURE);
    expect(result).toContain('storeFile file(System.getenv("ANDROID_RELEASE_KEYSTORE_PATH")');
    expect(result).toContain('storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")');
  });

  it('points the release build type at the release config, not debug', () => {
    const result = patchBuildGradle(FIXTURE);
    const releaseBlockStart = result.indexOf('release {');
    const releaseBlock = result.slice(releaseBlockStart, releaseBlockStart + 400);
    expect(releaseBlock).toContain('signingConfig signingConfigs.release');
    expect(releaseBlock).not.toContain('signingConfig signingConfigs.debug');
  });

  it('leaves the debug build type untouched', () => {
    const result = patchBuildGradle(FIXTURE);
    const debugBlockStart = result.indexOf('debug {', result.indexOf('buildTypes'));
    const debugBlock = result.slice(debugBlockStart, debugBlockStart + 60);
    expect(debugBlock).toContain('signingConfig signingConfigs.debug');
  });

  it('is idempotent — running twice does not double-patch', () => {
    const once = patchBuildGradle(FIXTURE);
    const twice = patchBuildGradle(once);
    expect(twice).toEqual(once);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd apps/tutora
npx jest plugins/__tests__/withReleaseSigning.test.js
```

Expected: FAIL — `Cannot find module '../withReleaseSigning'`.

- [ ] **Step 3: Write the plugin**

Create `apps/tutora/plugins/withReleaseSigning.js`:

```js
// Injects a `release` signingConfig into the generated android/app/build.gradle,
// reading the keystore path + passwords from environment variables that CI
// populates from GitHub Secrets. `android/` is git-ignored and regenerated by
// `expo prebuild` on every build, so this can't just be a hand-edited file —
// it has to be re-applied as a config plugin every time. Plain CommonJS (not
// TypeScript): Expo's local-plugin loader `require()`s this file directly
// without a build step.
const { withAppBuildGradle } = require('@expo/config-plugins');

const RELEASE_SIGNING_CONFIG_BLOCK = `        release {
            storeFile file(System.getenv("ANDROID_RELEASE_KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
        debug {`;

function patchBuildGradle(contents) {
  if (contents.includes('ANDROID_RELEASE_KEYSTORE_PATH')) {
    return contents; // already patched — keep prebuild idempotent
  }

  let patched = contents.replace(
    /signingConfigs \{\n {8}debug \{/,
    () => `signingConfigs {\n${RELEASE_SIGNING_CONFIG_BLOCK}`,
  );

  patched = patched.replace(
    /release \{\n(\s*)\/\/ Caution! In production, you need to generate your own keystore file\.\n(\s*)\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n(\s*)signingConfig signingConfigs\.debug/,
    (_match, indent1, _indent2, indent3) =>
      `release {\n${indent1}// Signed with the release keystore injected by CI (plugins/withReleaseSigning.js).\n${indent3}signingConfig signingConfigs.release`,
  );

  return patched;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = patchBuildGradle(config.modResults.contents);
    return config;
  });
}

module.exports = withReleaseSigning;
module.exports.patchBuildGradle = patchBuildGradle;
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/tutora
npx jest plugins/__tests__/withReleaseSigning.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Register the plugin in app.json**

Add `"./plugins/withReleaseSigning"` to the `plugins` array in
`apps/tutora/app.json` (after the `google-signin` entry):

```json
"plugins": [
  "expo-router",
  ["expo-splash-screen", { "backgroundColor": "#208AEF", "image": "./assets/images/splash-icon.png", "imageWidth": 76 }],
  "expo-secure-store",
  "expo-localization",
  "expo-notifications",
  ["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.808774514256-fp6lpvvdpshfefrvvpn734b8tsvfqeij" }],
  "./plugins/withReleaseSigning"
]
```

- [ ] **Step 6: Verify against a real prebuild**

```bash
cd apps/tutora
npx expo prebuild --platform android --no-install --clean
grep -n "ANDROID_RELEASE_KEYSTORE_PATH\|signingConfig signingConfigs" android/app/build.gradle
```

Expected: shows the injected `release` signingConfig block, and
`buildTypes { release { signingConfig signingConfigs.release } }` (not
`.debug`). If the real output doesn't match what Step 3's regex assumed
(templates do drift across Expo/RN versions), fix the regex in
`withReleaseSigning.js` now and re-run Steps 4 and 6 until both the unit test
and the real prebuild agree.

- [ ] **Step 7: Commit**

```bash
git add apps/tutora/plugins apps/tutora/app.json
git commit -m "feat(mobile): inject release signing config via a local Expo plugin"
```

---

### Task 4: Native-change fingerprint script

**Files:**

- Create: `apps/tutora/scripts/print-fingerprint.js`
- Modify: `apps/tutora/package.json` (add `@expo/fingerprint` devDependency)

- [ ] **Step 1: Add the dependency**

```bash
cd apps/tutora
pnpm add -D @expo/fingerprint
```

- [ ] **Step 2: Write the script**

Create `apps/tutora/scripts/print-fingerprint.js`:

```js
// Prints the project's native fingerprint hash to stdout — used by CI to
// decide whether a native rebuild (new APK) is needed, or the change is
// JS-only (OTA update via EAS Update is enough). Not a Jest-covered unit
// (it's a thin CLI wrapper); verified by running it, see Task 6.
const { createFingerprintAsync } = require('@expo/fingerprint');

createFingerprintAsync(process.cwd())
  .then((fingerprint) => {
    process.stdout.write(fingerprint.hash);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

- [ ] **Step 3: Run it locally to confirm it works**

```bash
cd apps/tutora
node scripts/print-fingerprint.js
```

Expected: prints a single hex hash string (e.g. `a1b2c3...`) with no error.

- [ ] **Step 4: Commit**

Run from the repo root (not `apps/tutora`):

```bash
git add apps/tutora/scripts/print-fingerprint.js apps/tutora/package.json pnpm-lock.yaml
git commit -m "feat(mobile): add native fingerprint script for CI rebuild detection"
```

---

### Task 5: `mobile-release.yml` workflow

**Files:**

- Create: `.github/workflows/mobile-release.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/mobile-release.yml`:

```yaml
name: Mobile Release

on:
  push:
    branches: [main]
    paths: ['apps/tutora/**']
  workflow_dispatch:

concurrency:
  group: mobile-release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  fingerprint:
    name: Check native fingerprint
    runs-on: ubuntu-latest
    outputs:
      native_changed: ${{ steps.compare.outputs.native_changed }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: pnpm/action-setup@v4

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - name: Compute current fingerprint
        id: current
        working-directory: apps/tutora
        run: echo "hash=$(node scripts/print-fingerprint.js)" >> "$GITHUB_OUTPUT"

      - name: Fetch previous release fingerprint
        id: previous
        run: |
          gh release download --pattern fingerprint.txt --dir /tmp/prev-release --clobber 2>/dev/null || true
          if [ -f /tmp/prev-release/fingerprint.txt ]; then
            echo "hash=$(cat /tmp/prev-release/fingerprint.txt)" >> "$GITHUB_OUTPUT"
          else
            echo "hash=none" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Compare
        id: compare
        run: |
          if [ "${{ steps.current.outputs.hash }}" != "${{ steps.previous.outputs.hash }}" ]; then
            echo "native_changed=true" >> "$GITHUB_OUTPUT"
          else
            echo "native_changed=false" >> "$GITHUB_OUTPUT"
          fi

  ota-update:
    name: Publish OTA update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: pnpm/action-setup@v4

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - uses: expo/expo-github-action@v8
        with:
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Publish update
        working-directory: apps/tutora
        run: |
          eas update --branch production --channel production \
            --environment production --non-interactive \
            --message "${{ github.event.head_commit.message }}"

  build-apk:
    name: Build & release APK
    needs: fingerprint
    if: needs.fingerprint.outputs.native_changed == 'true' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: pnpm/action-setup@v4

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - uses: android-actions/setup-android@v3

      - name: Accept SDK licenses
        run: yes | sdkmanager --licenses > /dev/null || true

      - name: Restore keystore
        working-directory: apps/tutora
        run: echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > release.keystore

      - name: Bump versionCode
        working-directory: apps/tutora
        run: |
          node -e "
            const fs = require('fs');
            const config = JSON.parse(fs.readFileSync('app.json', 'utf8'));
            config.expo.android = config.expo.android || {};
            config.expo.android.versionCode = ${{ github.run_number }};
            fs.writeFileSync('app.json', JSON.stringify(config, null, 2) + '\n');
          "

      - name: Prebuild
        working-directory: apps/tutora
        run: npx expo prebuild --platform android --no-install

      - name: Build release APK
        working-directory: apps/tutora/android
        env:
          ANDROID_RELEASE_KEYSTORE_PATH: ../release.keystore
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: ./gradlew assembleRelease

      - name: Save fingerprint for next run's comparison
        working-directory: apps/tutora
        run: node scripts/print-fingerprint.js > fingerprint.txt

      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: android-v${{ github.run_number }}
          name: Android v${{ github.run_number }}
          make_latest: true
          files: |
            apps/tutora/android/app/build/outputs/apk/release/app-release.apk
            apps/tutora/fingerprint.txt
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/mobile-release.yml
git commit -m "ci: add mobile release workflow (OTA update + conditional signed APK)"
```

- [ ] **Step 3: Push the branch and watch the first run**

```bash
git push -u origin <branch-name>
gh workflow run "Mobile Release"
gh run watch
```

Expected: `fingerprint` job succeeds and reports `native_changed=true` (no
prior release exists yet), `ota-update` succeeds, `build-apk` runs and
succeeds, and a new GitHub Release `android-v<N>` appears with
`app-release.apk` + `fingerprint.txt` attached. If any step fails, fix it and
re-run before moving to Task 6 — the client-side work in Tasks 6-9 is only
useful once this pipeline actually produces a working signed APK.

---

### Task 6: `useAppUpdates` hook (replaces `useOtaUpdates`)

**Files:**

- Create: `apps/tutora/src/features/updates/hooks/useAppUpdates.ts`
- Test: `apps/tutora/src/features/updates/hooks/__tests__/useAppUpdates.test.ts`
- Delete (later, in Task 8): `apps/tutora/src/shared/hooks/useOtaUpdates.ts` and its test

- [ ] **Step 1: Write the failing test**

Create `apps/tutora/src/features/updates/hooks/__tests__/useAppUpdates.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useAppUpdates } from '../useAppUpdates';

let mockReturn: {
  isUpdateAvailable: boolean;
  isDownloading: boolean;
  isUpdatePending: boolean;
  downloadProgress?: number;
};

jest.mock('expo-updates', () => {
  let enabled = false;
  return {
    __esModule: true,
    get isEnabled() {
      return enabled;
    },
    __setEnabled: (value: boolean) => {
      enabled = value;
    },
    useUpdates: () => mockReturn,
    checkForUpdateAsync: jest.fn(async () => undefined),
    fetchUpdateAsync: jest.fn(async () => undefined),
    reloadAsync: jest.fn(async () => undefined),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const updates = require('expo-updates') as {
  __setEnabled: (value: boolean) => void;
  checkForUpdateAsync: jest.Mock;
  fetchUpdateAsync: jest.Mock;
  reloadAsync: jest.Mock;
};

describe('useAppUpdates', () => {
  let changeHandler: ((state: string) => void) | undefined;

  beforeEach(() => {
    updates.__setEnabled(true);
    mockReturn = {
      isUpdateAvailable: false,
      isDownloading: false,
      isUpdatePending: false,
      downloadProgress: undefined,
    };
    changeHandler = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'change') changeHandler = handler as (state: string) => void;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stays idle when updates are disabled (dev / Expo Go), even if the underlying hook reports one available', () => {
    updates.__setEnabled(false);
    mockReturn.isUpdateAvailable = true;
    const { result } = renderHook(() => useAppUpdates());
    expect(result.current.status).toBe('idle');
  });

  it('moves to "available" when a foreground check finds an update', async () => {
    // The mock `useUpdates` is a plain object, not a reactive subscription
    // like the real one — mutating `mockReturn` needs an explicit `rerender`
    // to be picked up, standing in for the re-render the real hook would
    // trigger itself once `checkForUpdateAsync` resolves.
    const { result, rerender } = renderHook(() => useAppUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());

    mockReturn.isUpdateAvailable = true;
    await act(async () => {
      changeHandler?.('active');
    });
    rerender();

    expect(result.current.status).toBe('available');
    expect(updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('apply() calls fetchUpdateAsync and the caller can observe "downloading"', async () => {
    const { result, rerender } = renderHook(() => useAppUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());
    mockReturn.isUpdateAvailable = true;
    await act(async () => {
      changeHandler?.('active');
    });
    rerender();
    expect(result.current.status).toBe('available');

    updates.fetchUpdateAsync.mockImplementationOnce(async () => {
      mockReturn.isDownloading = true;
    });

    await act(async () => {
      await result.current.apply();
    });
    rerender();

    expect(updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('downloading');
  });

  it('reaches "restarting" and calls reloadAsync once the update is pending', async () => {
    mockReturn.isUpdatePending = true;
    const { result } = renderHook(() => useAppUpdates());

    await waitFor(() => expect(result.current.status).toBe('restarting'));
    await waitFor(() => expect(updates.reloadAsync).toHaveBeenCalledTimes(1));
  });

  it('dismiss() returns to idle and does not re-show until the next foreground', async () => {
    const { result } = renderHook(() => useAppUpdates());
    await waitFor(() => expect(changeHandler).toBeDefined());
    mockReturn.isUpdateAvailable = true;
    await act(async () => {
      changeHandler?.('active');
    });
    await waitFor(() => expect(result.current.status).toBe('available'));

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.status).toBe('idle');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd apps/tutora
npx jest src/features/updates --no-coverage
```

Expected: FAIL — `Cannot find module '../useAppUpdates'`.

- [ ] **Step 3: Write the hook**

Create `apps/tutora/src/features/updates/hooks/useAppUpdates.ts`:

```ts
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type AppUpdateStatus = 'idle' | 'available' | 'downloading' | 'restarting';

export type UseAppUpdatesResult = {
  status: AppUpdateStatus;
  downloadProgress: number | undefined;
  apply: () => Promise<void>;
  dismiss: () => void;
};

/**
 * Drives the visible update prompt (dialog → progress bar → restart).
 * `expo-updates` already checks once on cold start; this re-checks whenever
 * the app returns to the foreground, same trigger as the previous silent
 * hook, but now surfaces state for a UI instead of reloading unattended.
 *
 * `Updates.useUpdates()` is always called (rules-of-hooks — `Updates.isEnabled`
 * is a build-time constant, not something that can change between renders of
 * a running instance, so it must never gate the hook call itself, only what
 * we *do* with its result and whether we issue imperative calls). In dev /
 * Expo Go / web, `isEnabled` is false, so status is forced to `'idle'`
 * regardless of what the (inert there) native module reports.
 */
export function useAppUpdates(): UseAppUpdatesResult {
  const [dismissed, setDismissed] = useState(false);
  const { isUpdateAvailable, isDownloading, isUpdatePending, downloadProgress } =
    Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled) return;

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        setDismissed(false);
        void Updates.checkForUpdateAsync().catch(() => {
          // A failed check never blocks the running bundle.
        });
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Updates.isEnabled && isUpdatePending) {
      void Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  async function apply(): Promise<void> {
    try {
      await Updates.fetchUpdateAsync();
    } catch {
      // Download failure: stay on the current bundle, no crash.
    }
  }

  function dismiss(): void {
    setDismissed(true);
  }

  let status: AppUpdateStatus = 'idle';
  if (Updates.isEnabled) {
    if (isUpdatePending) {
      status = 'restarting';
    } else if (isDownloading) {
      status = 'downloading';
    } else if (isUpdateAvailable && !dismissed) {
      status = 'available';
    }
  }

  return {
    status,
    downloadProgress: Updates.isEnabled ? downloadProgress : undefined,
    apply,
    dismiss,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/tutora
npx jest src/features/updates --no-coverage
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/tutora/src/features/updates
git commit -m "feat(mobile): add useAppUpdates hook with visible status states"
```

---

### Task 7: `UpdatePromptModal` component + i18n keys

**Files:**

- Create: `apps/tutora/src/features/updates/components/UpdatePromptModal.tsx`
- Test: `apps/tutora/src/features/updates/components/__tests__/UpdatePromptModal.test.tsx`
- Modify: `apps/tutora/src/shared/i18n/locales/az.json`, `en.json`, `ru.json`

- [ ] **Step 1: Add i18n keys**

Add this block to all three locale files (top-level key `updates`, alongside
the existing `notifications` block):

`az.json`:

```json
"updates": {
  "title": "Yeni versiya var",
  "message": "Tətbiqin yeni versiyası hazırdır.",
  "later": "Sonra",
  "updateNow": "Yenilə",
  "downloading": "Yüklənir...",
  "restarting": "Tətbiq yenilənir..."
}
```

`en.json`:

```json
"updates": {
  "title": "Update available",
  "message": "A new version of the app is ready.",
  "later": "Later",
  "updateNow": "Update now",
  "downloading": "Downloading...",
  "restarting": "Restarting..."
}
```

`ru.json`:

```json
"updates": {
  "title": "Доступно обновление",
  "message": "Готова новая версия приложения.",
  "later": "Позже",
  "updateNow": "Обновить",
  "downloading": "Загрузка...",
  "restarting": "Перезапуск..."
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/tutora/src/features/updates/components/__tests__/UpdatePromptModal.test.tsx`:

```tsx
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { UpdatePromptModal } from '../UpdatePromptModal';

// `renderWithProviders` defaults to the app's default locale ('az', per
// DEFAULT_LANGUAGE) — pass `language: 'en'` explicitly so these assertions
// don't depend on that default, matching the convention in
// shared/i18n/__tests__/i18n.test.tsx.
describe('UpdatePromptModal', () => {
  it('renders nothing when idle', async () => {
    await renderWithProviders(
      <UpdatePromptModal
        status="idle"
        downloadProgress={undefined}
        onApply={jest.fn()}
        onDismiss={jest.fn()}
      />,
      { language: 'en' },
    );
    expect(screen.queryByText('Update available')).toBeNull();
  });

  it('shows the prompt with both actions when available', async () => {
    const onApply = jest.fn();
    const onDismiss = jest.fn();
    await renderWithProviders(
      <UpdatePromptModal
        status="available"
        downloadProgress={undefined}
        onApply={onApply}
        onDismiss={onDismiss}
      />,
      { language: 'en' },
    );

    expect(screen.getByText('Update available')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Update now'));
    expect(onApply).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Later'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows a progress bar while downloading', async () => {
    await renderWithProviders(
      <UpdatePromptModal
        status="downloading"
        downloadProgress={0.42}
        onApply={jest.fn()}
        onDismiss={jest.fn()}
      />,
      { language: 'en' },
    );

    expect(screen.getByText('Downloading...')).toBeOnTheScreen();
    // Accessibility label includes the literal "..." from the translation string.
    expect(screen.getByLabelText('Downloading..., 42%')).toBeOnTheScreen();
  });

  it('shows a branded full-screen message while restarting', async () => {
    await renderWithProviders(
      <UpdatePromptModal
        status="restarting"
        downloadProgress={1}
        onApply={jest.fn()}
        onDismiss={jest.fn()}
      />,
      { language: 'en' },
    );

    expect(screen.getByText('Restarting...')).toBeOnTheScreen();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
cd apps/tutora
npx jest src/features/updates/components --no-coverage
```

Expected: FAIL — `Cannot find module '../UpdatePromptModal'`.

- [ ] **Step 4: Write the component**

Create `apps/tutora/src/features/updates/components/UpdatePromptModal.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Modal, Text } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import type { AppUpdateStatus } from '../hooks/useAppUpdates';

export type UpdatePromptModalProps = {
  status: AppUpdateStatus;
  downloadProgress: number | undefined;
  onApply: () => void;
  onDismiss: () => void;
};

export function UpdatePromptModal({
  status,
  downloadProgress,
  onApply,
  onDismiss,
}: UpdatePromptModalProps) {
  const { t } = useTranslation();
  const colors = useColors();

  if (status === 'restarting') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.primary }]}>
        <Text variant="subtitle" color="onPrimary">
          {t('updates.restarting')}
        </Text>
      </View>
    );
  }

  if (status === 'idle') {
    return null;
  }

  const progressPercent = Math.round((downloadProgress ?? 0) * 100);

  return (
    <Modal
      visible
      onClose={onDismiss}
      title={t('updates.title')}
      hideCloseButton={status === 'downloading'}
    >
      <Text variant="body">{t('updates.message')}</Text>

      {status === 'downloading' ? (
        <View style={styles.progressSection}>
          <Text variant="caption">{t('updates.downloading')}</Text>
          <View
            style={[styles.track, { backgroundColor: colors.disabled }]}
            accessibilityLabel={`${t('updates.downloading')}, ${progressPercent}%`}
          >
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button variant="outline" label={t('updates.later')} onPress={onDismiss} />
          <Button variant="primary" label={t('updates.updateNow')} onPress={onApply} />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  progressSection: {
    gap: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd apps/tutora
npx jest src/features/updates --no-coverage
```

Expected: PASS, all tests across both new test files.

- [ ] **Step 6: Commit**

```bash
git add apps/tutora/src/features/updates apps/tutora/src/shared/i18n/locales
git commit -m "feat(mobile): add UpdatePromptModal with progress bar and i18n copy"
```

---

### Task 8: `UpdatesBridge` + wire into root layout, remove the old hook

**Files:**

- Create: `apps/tutora/src/features/updates/components/UpdatesBridge.tsx`
- Create: `apps/tutora/src/features/updates/index.ts`
- Modify: `apps/tutora/src/app/_layout.tsx`
- Delete: `apps/tutora/src/shared/hooks/useOtaUpdates.ts`
- Delete: `apps/tutora/src/shared/hooks/__tests__/useOtaUpdates.test.ts`

- [ ] **Step 1: Write the bridge**

Create `apps/tutora/src/features/updates/components/UpdatesBridge.tsx`:

```tsx
import { useAppUpdates } from '../hooks/useAppUpdates';
import { UpdatePromptModal } from './UpdatePromptModal';

/**
 * Render-less-except-for-the-prompt bridge, mounted once at the app root
 * (mirrors NotificationsBridge). Owns no business logic beyond wiring the
 * hook's state into the modal.
 */
export function UpdatesBridge() {
  const { status, downloadProgress, apply, dismiss } = useAppUpdates();

  return (
    <UpdatePromptModal
      status={status}
      downloadProgress={downloadProgress}
      onApply={apply}
      onDismiss={dismiss}
    />
  );
}
```

- [ ] **Step 2: Write the barrel**

Create `apps/tutora/src/features/updates/index.ts`:

```ts
export { UpdatesBridge } from './components/UpdatesBridge';
export { useAppUpdates } from './hooks/useAppUpdates';
export type { AppUpdateStatus, UseAppUpdatesResult } from './hooks/useAppUpdates';
```

- [ ] **Step 3: Wire it into the root layout**

In `apps/tutora/src/app/_layout.tsx`, replace:

```ts
import { useOtaUpdates } from '@/shared/hooks/useOtaUpdates';
```

with:

```ts
import { UpdatesBridge } from '@features/updates';
```

Remove the `useOtaUpdates();` call inside `RootLayout`. Add `<UpdatesBridge
/>` next to `<NotificationsBridge />`:

```tsx
                  <StatusBar style="auto" />
                  <NotificationsBridge />
                  <UpdatesBridge />
                  <Stack screenOptions={{ headerShown: false }} />
```

Update the file's top comment to mention `UpdatesBridge` alongside
`NotificationsBridge` (both are render-mostly-null bridges mounted at the
root).

- [ ] **Step 4: Delete the old hook and its test**

```bash
git rm apps/tutora/src/shared/hooks/useOtaUpdates.ts
git rm apps/tutora/src/shared/hooks/__tests__/useOtaUpdates.test.ts
```

- [ ] **Step 5: Run the full mobile test suite**

```bash
cd apps/tutora
pnpm test
```

Expected: PASS, no failures, no reference to the deleted `useOtaUpdates`
anywhere.

- [ ] **Step 6: Typecheck**

```bash
cd apps/tutora
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/tutora/src/features/updates apps/tutora/src/app/_layout.tsx
git commit -m "feat(mobile): wire UpdatesBridge into root layout, remove silent OTA hook"
```

---

### Task 9: End-to-end verification (manual, on a real device)

**Files:** none — this is a verification pass, not a code change.

- [ ] **Step 1: Confirm the APK installs and launches**

Download the latest APK:

```bash
gh release download --pattern '*.apk' --dir /tmp/tutora-release
```

Install it on a physical device or emulator connected via `adb`:

```bash
adb install -r /tmp/tutora-release/app-release.apk
```

Expected: installs and launches without the `PluginError` or SDK-mismatch
errors seen earlier in this session (this is a real signed release build,
not Expo Go).

- [ ] **Step 2: Ship a JS-only change and confirm the OTA prompt appears**

Make any trivial JS/text change on `main` (e.g. a copy tweak) and push it.
Confirm in `gh run watch` that `fingerprint` reports `native_changed=false`
and only `ota-update` ran (no new GitHub Release was created). Foreground the
installed app (background it, then bring it back) and confirm:

- The **"Yeni versiya var"** modal appears with **Yenilə** / **Sonra**.
- Tapping **Yenilə** shows a moving progress bar, then a branded
  "Tətbiq yenilənir..." screen, then the app restarts showing the new copy.
- Tapping **Sonra** dismisses it, and it reappears next time the app is
  foregrounded (don't restart the app between — background/foreground it
  again).

- [ ] **Step 3: Confirm a native change triggers a real rebuild**

Add a trivial native-affecting change (e.g. bump a dependency version in
`apps/tutora/package.json`) and push to `main`. Confirm `fingerprint` reports
`native_changed=true`, `build-apk` runs, and a new GitHub Release with a new
APK appears. Confirm the **old** installed APK does **not** get an OTA prompt
for this change (different `runtimeVersion` — expected and correct), and that
installing the **new** APK (`adb install -r`, no uninstall) succeeds without
a signature mismatch error (this is the real proof the keystore reuse from
Task 2 is wired correctly end to end).

---

## Summary of what's now true after this plan

- Every push to `main` that touches `apps/tutora/**` publishes a free EAS
  Update; a signed APK is only rebuilt when native surface actually changed.
- Anyone can download the current build from
  `https://github.com/<owner>/tutora/releases/latest/download/app-release.apk`.
- Installed apps show a real update prompt with a real progress bar and a
  branded restart, never a silent background reload and never a bare white
  screen.

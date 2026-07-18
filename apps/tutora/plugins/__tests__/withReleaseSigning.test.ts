// The plugin itself is plain CommonJS (Expo's local-plugin loader `require()`s
// it directly, no build step) — jest's testMatch only picks up .ts/.tsx here,
// so the test lives in TS and reaches into the JS module via `require`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { patchBuildGradle } = require('../withReleaseSigning') as {
  patchBuildGradle: (contents: string) => string;
};

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
    // Search from `buildTypes` onward — `signingConfigs` now also contains a
    // `release {` block (the injected signingConfig), which would otherwise
    // match first since it comes earlier in the file.
    const releaseBlockStart = result.indexOf('release {', result.indexOf('buildTypes'));
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

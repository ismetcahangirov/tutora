import { withSentry } from '@sentry/react-native/expo';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config layered on top of app.json (issues #90 + #92).
 *
 * app.json stays the static source of truth (icons, splash, plugins); this file
 * adds the pieces that depend on the environment: EAS Update wiring (#90) and
 * the Sentry source-map upload plugin (#92). Everything is opt-in via env vars,
 * so `expo prebuild` and local dev work with zero extra configuration.
 */
const easProjectId = process.env.EAS_PROJECT_ID;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

export default ({ config }: ConfigContext): ExpoConfig => {
  const withUpdates: ExpoConfig = {
    ...(config as ExpoConfig),
    // Serve an update only to builds of the same app version, so a JS bundle is
    // never delivered to a native binary it is incompatible with.
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      ...config.updates,
      // The update endpoint is derived from the EAS project id, populated by
      // `eas init`. Left unset until then so dev builds don't point at a stub.
      ...(easProjectId ? { url: `https://u.expo.dev/${easProjectId}` } : {}),
    },
    extra: {
      ...config.extra,
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
  };

  // Wrap with the Sentry plugin only when an org + project are configured, so
  // prebuild works without Sentry credentials. During `eas build` the plugin
  // uploads source maps using the SENTRY_AUTH_TOKEN secret stored in EAS.
  if (sentryOrg && sentryProject) {
    return withSentry(withUpdates, { organization: sentryOrg, project: sentryProject });
  }
  return withUpdates;
};

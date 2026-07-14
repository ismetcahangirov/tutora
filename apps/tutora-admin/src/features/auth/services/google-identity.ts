/**
 * Minimal boundary over Google Identity Services (GIS). Isolated here so the
 * browser global never leaks into the store or its tests — everything above this
 * file works with a plain `idToken` string.
 */
import { GOOGLE_GSI_SRC } from '../constants';

/** The single field of the GIS credential response we consume. */
export type GoogleCredentialResponse = { credential?: string };

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
      disableAutoSelect: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

let scriptPromise: Promise<GoogleIdentityApi> | null = null;

/** Inject the GIS script once and resolve when `window.google` is ready. */
export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  if (window.google) return Promise.resolve(window.google);
  scriptPromise ??= new Promise<GoogleIdentityApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) resolve(window.google);
      else reject(new Error('Google Identity failed to initialize'));
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google Identity script'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Stop GIS from auto-selecting the last account on the next visit. */
export function googleDisableAutoSelect(): void {
  window.google?.accounts.id.disableAutoSelect();
}

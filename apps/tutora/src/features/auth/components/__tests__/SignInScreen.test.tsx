/**
 * SignInScreen — Google sign-in UI states (issue #22).
 *
 * The gateway, storage, and API are mocked (no native module runs). We verify
 * the Google button renders, a loading state shows while signing in, and an
 * error state appears on failure. RNTL v14 is fully async — every render /
 * event is awaited.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils';

import { signInWithGoogleIdToken } from '@features/auth/api/auth.api';
import { AuthProvider } from '@features/auth/context/AuthProvider';
import { googleAuthGateway } from '@features/auth/services/google-auth.gateway';
import en from '@/shared/i18n/locales/en.json';

import { SignInScreen } from '../SignInScreen';

jest.mock('@features/auth/services/google-auth.gateway', () => ({
  googleAuthGateway: { signIn: jest.fn(), signOut: jest.fn(async () => undefined) },
}));
jest.mock('@features/auth/services/auth-storage', () => ({
  authStorage: {
    setTokens: jest.fn(async () => undefined),
    getTokens: jest.fn(async () => null),
    clear: jest.fn(async () => undefined),
  },
}));
jest.mock('@features/auth/api/auth.api', () => ({
  signInWithGoogleIdToken: jest.fn(),
}));

const mockedGateway = jest.mocked(googleAuthGateway);
const mockedApi = jest.mocked(signInWithGoogleIdToken);

/** A promise plus its resolver, so a test can hold a call in-flight then release. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function renderScreen() {
  return renderWithProviders(
    <AuthProvider>
      <SignInScreen />
    </AuthProvider>,
  );
}

describe('SignInScreen (#22)', () => {
  it('renders the Continue with Google button', async () => {
    await renderScreen();

    expect(screen.getByRole('button', { name: en.auth.screen.continueWithGoogle })).toBeTruthy();
  });

  it('shows a loading state while signing in', async () => {
    // Gateway resolves so `act` settles, but the backend call is held in-flight,
    // keeping the flow in its "signing in" state for the assertion.
    mockedGateway.signIn.mockResolvedValue({ idToken: 'id-token-abc' });
    const pending = deferred<never>();
    mockedApi.mockReturnValue(pending.promise);

    await renderScreen();
    // Not awaited: the handler stays suspended on the in-flight backend call, so
    // awaiting `press` would block the test. The busy state flips synchronously.
    void fireEvent.press(screen.getByRole('button', { name: en.auth.screen.continueWithGoogle }));

    await waitFor(() => expect(screen.getByRole('button')).toBeBusy());
  });

  it('shows an error state when sign-in fails', async () => {
    mockedGateway.signIn.mockRejectedValue(new Error('boom'));

    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: en.auth.screen.continueWithGoogle }));

    await waitFor(() => expect(screen.getByText(en.auth.error.title)).toBeTruthy());
    expect(mockedApi).not.toHaveBeenCalled();
  });
});

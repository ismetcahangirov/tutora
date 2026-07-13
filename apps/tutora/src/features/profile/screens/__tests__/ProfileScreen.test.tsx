/**
 * ProfileScreen (#49) — renders the identity block and preference groups, lists
 * saved searches with apply/delete, and signs out. `useAuth` is mocked (no
 * provider); the saved-searches store is real and reset per test.
 */
import { useAuth } from '@features/auth';
import type { AuthContextValue } from '@features/auth';
import {
  addSavedSearch,
  clearSavedSearches,
} from '@features/saved-searches/store/saved-searches-store';

import { ProfileScreen } from '../ProfileScreen';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

jest.mock('@features/auth', () => ({ useAuth: jest.fn() }));
// Stub the notifications barrel so the screen doesn't pull in the push bridge or
// poll the unread-count endpoint here — the badge behaviour is tested in the
// notifications feature.
jest.mock('@features/notifications', () => ({
  useUnreadNotificationsCount: () => ({ count: 0 }),
  NotificationsBadge: () => null,
}));
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const signOut = jest.fn();

function mockAuth(): void {
  mockedUseAuth.mockReturnValue({
    user: {
      id: 'u1',
      email: 'aygun@example.com',
      name: 'Aygün Məmmədova',
      avatarUrl: null,
      role: 'STUDENT',
      onboardingCompleted: true,
    },
    signOut,
  } as unknown as AuthContextValue);
}

beforeEach(() => {
  clearSavedSearches();
  signOut.mockClear();
  mockAuth();
});

describe('ProfileScreen (#49)', () => {
  it('renders identity, role, and preference groups', async () => {
    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={jest.fn()}
        onOpenMyReviews={jest.fn()}
        onOpenNotifications={jest.fn()}
      />,
    );

    expect(screen.getByText('Aygün Məmmədova')).toBeOnTheScreen();
    expect(screen.getByText('aygun@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Student')).toBeOnTheScreen();
    expect(screen.getByText('Appearance')).toBeOnTheScreen();
    expect(screen.getByText('Language')).toBeOnTheScreen();
  });

  it('shows the empty saved-searches hint when there are none', async () => {
    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={jest.fn()}
        onOpenMyReviews={jest.fn()}
        onOpenNotifications={jest.fn()}
      />,
    );
    expect(screen.getByText('You haven’t saved any searches yet.')).toBeOnTheScreen();
  });

  it('applies a saved search on tap', async () => {
    const saved = addSavedSearch({
      name: 'Math online',
      query: 'math',
      selection: { subject: ['s1'] },
    });
    const onApply = jest.fn();

    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={onApply}
        onOpenMyReviews={jest.fn()}
        onOpenNotifications={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByText('Math online'));
    expect(onApply).toHaveBeenCalledWith(saved?.id);
  });

  it('opens the caller’s reviews from the activity row', async () => {
    const onOpenMyReviews = jest.fn();

    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={jest.fn()}
        onOpenMyReviews={onOpenMyReviews}
        onOpenNotifications={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByText('My reviews'));
    expect(onOpenMyReviews).toHaveBeenCalledTimes(1);
  });

  it('opens notifications from the activity row', async () => {
    const onOpenNotifications = jest.fn();

    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={jest.fn()}
        onOpenMyReviews={jest.fn()}
        onOpenNotifications={onOpenNotifications}
      />,
    );

    await fireEvent.press(screen.getByText('Notifications'));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('deletes a saved search', async () => {
    addSavedSearch({ name: 'Math online', query: 'math', selection: { subject: ['s1'] } });

    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={jest.fn()}
        onOpenMyReviews={jest.fn()}
        onOpenNotifications={jest.fn()}
      />,
    );

    expect(screen.getByText('Math online')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete saved search' }));
    expect(screen.queryByText('Math online')).toBeNull();
  });

  it('signs out', async () => {
    await renderWithProviders(
      <ProfileScreen
        onApplySavedSearch={jest.fn()}
        onOpenMyReviews={jest.fn()}
        onOpenNotifications={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

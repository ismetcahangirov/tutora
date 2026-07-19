/**
 * TutorDetailScreen (#171) — regression coverage for the "Contact Tutor" CTA:
 * it opens a real chat thread and hands it to `onContact` (#173), and a caller
 * with no active application gets a distinct error toast instead of a silent
 * no-op. `useTutorDetail` and the chat hook are mocked; favorites use the real
 * (in-memory) store.
 */
import { useToast } from '@/components/ui';
import { clearFavorites } from '@features/favorites';
import { NoActiveApplicationError, useStartThreadWithTutor, type ChatThread } from '@features/chat';
import { useTutorDetail } from '@features/tutors/hooks/useTutorDetail';
import { tutorProfile } from '@features/tutors/__tests__/fixtures';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils';

import { TutorDetailScreen } from '../TutorDetailScreen';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/reviews', () => ({ ReviewsPreview: () => null }));
jest.mock('@features/tutors/hooks/useTutorDetail', () => ({ useTutorDetail: jest.fn() }));
// Mock the barrel directly (not via `requireActual`) — the real barrel also
// re-exports `MessagesScreen`, which pulls in the auth feature's Google
// Sign-In gateway and needs a native module Jest can't provide.
jest.mock('@features/chat', () => ({
  useStartThreadWithTutor: jest.fn(),
  NoActiveApplicationError: jest.requireActual('@features/chat/api/chat.api')
    .NoActiveApplicationError,
}));

const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockedUseTutorDetail = useTutorDetail as jest.MockedFunction<typeof useTutorDetail>;
const mockedUseStartThread = useStartThreadWithTutor as jest.MockedFunction<
  typeof useStartThreadWithTutor
>;

const show = jest.fn();
const startThread = jest.fn();

const thread: ChatThread = {
  id: 'th1',
  counterpart: { userId: 'tutor-1', name: 'Aygün Məmmədova', avatarUrl: null, role: 'TUTOR' },
  lastMessage: null,
  unreadCount: 0,
  lastMessageAt: null,
  createdAt: '2026-07-13T09:00:00.000Z',
};

beforeEach(() => {
  clearFavorites();
  show.mockClear();
  startThread.mockReset();
  mockedUseToast.mockReturnValue({ show, hide: jest.fn() });
  mockedUseStartThread.mockReturnValue({ startThread, isStarting: false });
  mockedUseTutorDetail.mockReturnValue({
    data: tutorProfile,
    isLoading: false,
    isError: false,
    error: null,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useTutorDetail>);
});

describe('TutorDetailScreen (#171)', () => {
  it('opens the chat thread and hands it to onContact on success', async () => {
    startThread.mockResolvedValueOnce(thread);
    const onContact = jest.fn();

    await renderWithProviders(
      <TutorDetailScreen id="tutor-1" onBack={jest.fn()} onContact={onContact} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Contact tutor' }));

    await waitFor(() => expect(onContact).toHaveBeenCalledWith(thread));
    expect(startThread).toHaveBeenCalledWith('tutor-1');
    expect(show).not.toHaveBeenCalled();
  });

  it('shows a distinct toast when the caller has no active application', async () => {
    startThread.mockRejectedValueOnce(new NoActiveApplicationError());
    const onContact = jest.fn();

    await renderWithProviders(
      <TutorDetailScreen id="tutor-1" onBack={jest.fn()} onContact={onContact} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Contact tutor' }));

    await waitFor(() =>
      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You can message a tutor once you have an application with them.',
          type: 'error',
        }),
      ),
    );
    expect(onContact).not.toHaveBeenCalled();
  });

  it('shows a generic error toast for any other failure', async () => {
    startThread.mockRejectedValueOnce(new Error('network down'));

    await renderWithProviders(
      <TutorDetailScreen id="tutor-1" onBack={jest.fn()} onContact={jest.fn()} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Contact tutor' }));

    await waitFor(() =>
      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Couldn’t start the conversation. Please try again.',
          type: 'error',
        }),
      ),
    );
  });
});

/**
 * Notification deep-linking (#50) — payload → route resolution.
 */
import { resolveNotificationRoute } from '../deep-link';

describe('resolveNotificationRoute', () => {
  it('routes a chat payload to the thread', () => {
    expect(resolveNotificationRoute({ threadId: 't1' })).toEqual({
      pathname: '/chat/[id]',
      params: { id: 't1' },
    });
  });

  it('routes a tutor payload to the tutor detail', () => {
    expect(resolveNotificationRoute({ tutorId: 'tut1' })).toEqual({
      pathname: '/tutor/[id]',
      params: { id: 'tut1' },
    });
  });

  it('prefers a thread over a tutor when both are present', () => {
    expect(resolveNotificationRoute({ threadId: 't1', tutorId: 'tut1' })).toEqual({
      pathname: '/chat/[id]',
      params: { id: 't1' },
    });
  });

  it('falls back to the feed for an empty, null, or non-string payload', () => {
    expect(resolveNotificationRoute(null)).toEqual({ pathname: '/notifications' });
    expect(resolveNotificationRoute({})).toEqual({ pathname: '/notifications' });
    expect(resolveNotificationRoute({ threadId: 42 })).toEqual({ pathname: '/notifications' });
  });
});

import { ChatPresenceService } from './chat.presence';

describe('ChatPresenceService', () => {
  it('reports a user online after adding a socket', () => {
    const presence = new ChatPresenceService();
    presence.add('u1', 's1');
    expect(presence.isOnline('u1')).toBe(true);
  });

  it('stays online while any socket remains', () => {
    const presence = new ChatPresenceService();
    presence.add('u1', 's1');
    presence.add('u1', 's2');
    expect(presence.remove('u1', 's1')).toBe(false);
    expect(presence.isOnline('u1')).toBe(true);
  });

  it('returns true on the last socket removal and marks the user offline', () => {
    const presence = new ChatPresenceService();
    presence.add('u1', 's1');
    expect(presence.remove('u1', 's1')).toBe(true);
    expect(presence.isOnline('u1')).toBe(false);
  });

  it('is a no-op when removing an unknown user', () => {
    const presence = new ChatPresenceService();
    expect(presence.remove('ghost', 's1')).toBe(false);
  });
});

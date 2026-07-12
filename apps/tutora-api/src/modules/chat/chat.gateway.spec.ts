import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CHAT_EVENTS, threadRoom, userRoom } from './chat.events';
import { ChatGateway } from './chat.gateway';
import { ChatPresenceService } from './chat.presence';
import { ChatRealtime } from './chat.realtime';
import type { ChatService } from './chat.service';

function buildSocket(overrides: Record<string, unknown> = {}) {
  const emit = jest.fn();
  const socket: Record<string, unknown> = {
    id: 'sock1',
    data: {},
    handshake: { auth: { token: 'good' }, headers: {} },
    rooms: new Set<string>(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    to: jest.fn(() => ({ emit })),
    ...overrides,
  };
  return { socket: socket as never, emit };
}

function buildGateway(opts: { verify?: jest.Mock; assertParticipant?: jest.Mock } = {}) {
  const jwt = {
    verifyAsync: opts.verify ?? jest.fn().mockResolvedValue({ sub: 'u1' }),
  } as unknown as JwtService;
  const config = { getOrThrow: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;
  const presence = new ChatPresenceService();
  const realtime = new ChatRealtime();
  const chat = {
    assertParticipant:
      opts.assertParticipant ?? jest.fn().mockResolvedValue({ counterpartUserId: 'u2' }),
  } as unknown as ChatService;
  const gateway = new ChatGateway(realtime, presence, chat, jwt, config);
  return { gateway, presence, chat };
}

describe('ChatGateway.handleConnection', () => {
  it('authenticates, registers presence and joins the personal room', async () => {
    const { gateway, presence } = buildGateway();
    const { socket } = buildSocket();

    await gateway.handleConnection(socket);

    expect((socket as { data: { userId?: string } }).data.userId).toBe('u1');
    expect(presence.isOnline('u1')).toBe(true);
    expect((socket as { join: jest.Mock }).join).toHaveBeenCalledWith(userRoom('u1'));
    expect((socket as { on: jest.Mock }).on).toHaveBeenCalledWith(
      'disconnecting',
      expect.any(Function),
    );
  });

  it('disconnects a socket with an invalid token', async () => {
    const verify = jest.fn().mockRejectedValue(new Error('bad'));
    const { gateway, presence } = buildGateway({ verify });
    const { socket } = buildSocket();

    await gateway.handleConnection(socket);

    expect((socket as { disconnect: jest.Mock }).disconnect).toHaveBeenCalled();
    expect((socket as { join: jest.Mock }).join).not.toHaveBeenCalled();
    expect(presence.isOnline('u1')).toBe(false);
  });
});

describe('ChatGateway thread events', () => {
  it('joins a thread room after the participant check passes', async () => {
    const { gateway, chat } = buildGateway();
    const { socket } = buildSocket({ data: { userId: 'u1' } });

    await gateway.onThreadJoin(socket, { threadId: 't1' });

    expect((chat as { assertParticipant: jest.Mock }).assertParticipant).toHaveBeenCalledWith(
      'u1',
      't1',
    );
    expect((socket as { join: jest.Mock }).join).toHaveBeenCalledWith(threadRoom('t1'));
  });

  it('rejects joining a thread the caller does not participate in', async () => {
    const assertParticipant = jest.fn().mockRejectedValue(new Error('nope'));
    const { gateway } = buildGateway({ assertParticipant });
    const { socket } = buildSocket({ data: { userId: 'u1' } });

    await expect(gateway.onThreadJoin(socket, { threadId: 't1' })).rejects.toThrow();
    expect((socket as { join: jest.Mock }).join).not.toHaveBeenCalled();
  });

  it('broadcasts typing to the rest of the thread room', async () => {
    const { gateway } = buildGateway();
    const { socket, emit } = buildSocket({ data: { userId: 'u1' } });

    await gateway.onTyping(socket, { threadId: 't1', isTyping: true });

    expect((socket as { to: jest.Mock }).to).toHaveBeenCalledWith(threadRoom('t1'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.TYPING, {
      threadId: 't1',
      userId: 'u1',
      isTyping: true,
    });
  });
});

describe('ChatGateway disconnecting', () => {
  it("emits offline to the thread rooms on the user's last socket", async () => {
    const { gateway, presence } = buildGateway();
    const { socket, emit } = buildSocket();
    await gateway.handleConnection(socket);
    (socket as { rooms: Set<string> }).rooms = new Set([threadRoom('t1'), userRoom('u1')]);

    const onMock = (socket as { on: jest.Mock }).on;
    const disconnecting = (onMock.mock.calls as [string, () => void][]).find(
      (call) => call[0] === 'disconnecting',
    )?.[1];
    disconnecting();

    expect(presence.isOnline('u1')).toBe(false);
    expect((socket as { to: jest.Mock }).to).toHaveBeenCalledWith(threadRoom('t1'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.PRESENCE, { userId: 'u1', status: 'offline' });
  });
});

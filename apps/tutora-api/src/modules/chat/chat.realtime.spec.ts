import type { Server } from 'socket.io';
import { CHAT_EVENTS, threadRoom, userRoom } from './chat.events';
import { ChatRealtime } from './chat.realtime';
import type { MessageView } from './chat.types';

function buildServerMock() {
  const emit = jest.fn();
  const toChain = jest.fn();
  const chain: { emit: jest.Mock; to: jest.Mock } = { emit, to: toChain };
  chain.to.mockReturnValue(chain);
  const serverTo = jest.fn().mockReturnValue(chain);
  const server = { to: serverTo } as unknown as Server;
  return { server, serverTo, toChain, emit };
}

const message = { id: 'm1', threadId: 't1', senderId: 'u1', isMine: true } as MessageView;

describe('ChatRealtime', () => {
  it('does nothing before a server is bound', () => {
    const realtime = new ChatRealtime();
    expect(() => realtime.emitNewMessage(message, 'u2')).not.toThrow();
  });

  it('emits a new message to the thread room and the recipient room', () => {
    const { server, serverTo, toChain, emit } = buildServerMock();
    const realtime = new ChatRealtime();
    realtime.bind(server);

    realtime.emitNewMessage(message, 'u2');

    expect(serverTo).toHaveBeenCalledWith(threadRoom('t1'));
    expect(toChain).toHaveBeenCalledWith(userRoom('u2'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.MESSAGE_NEW, message);
  });

  it('emits a read receipt to the thread room', () => {
    const { server, serverTo, emit } = buildServerMock();
    const realtime = new ChatRealtime();
    realtime.bind(server);
    const receipt = {
      threadId: 't1',
      readerUserId: 'u1',
      readAt: new Date('2026-05-02T00:00:00Z'),
    };

    realtime.emitRead(receipt);

    expect(serverTo).toHaveBeenCalledWith(threadRoom('t1'));
    expect(emit).toHaveBeenCalledWith(CHAT_EVENTS.MESSAGE_READ, receipt);
  });
});

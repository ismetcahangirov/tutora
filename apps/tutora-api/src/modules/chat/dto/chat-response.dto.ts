import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

/**
 * Response shapes for the chat endpoints. These mirror the projections in
 * `chat.types.ts` (`ThreadView`, `MessageView` & friends) plus the small ad-hoc
 * count envelopes returned by the controller. They exist so Swagger can advertise
 * the response schema — the TypeScript interfaces are erased at compile time and
 * are invisible to the OpenAPI generator.
 */

/** The other party in a 1:1 thread, resolved relative to the caller. */
export class ChatCounterpartDto {
  @ApiProperty({ description: 'Counterparty user id.' })
  userId!: string;

  @ApiProperty({ nullable: true, type: String, description: 'Display name, if set.' })
  name!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Avatar URL, if set.' })
  avatarUrl!: string | null;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', description: 'Counterparty role.' })
  role!: UserRole;
}

/** Compact preview of a thread's latest message for the thread list. */
export class ChatMessagePreviewDto {
  @ApiProperty({ description: 'Message id.' })
  id!: string;

  @ApiProperty({ description: 'Message body.' })
  body!: string;

  @ApiProperty({ description: 'Sender user id.' })
  senderId!: string;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;
}

/** A chat thread projected relative to the caller. */
export class ThreadViewDto {
  @ApiProperty({ description: 'Thread id.' })
  id!: string;

  @ApiProperty({ type: ChatCounterpartDto })
  counterpart!: ChatCounterpartDto;

  @ApiProperty({ type: ChatMessagePreviewDto, nullable: true })
  lastMessage!: ChatMessagePreviewDto | null;

  @ApiProperty({ description: "Caller's unread message count in this thread." })
  unreadCount!: number;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the last message was sent, if any.',
  })
  lastMessageAt!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;
}

/** A single chat message, flagged as authored by the caller or not. */
export class MessageViewDto {
  @ApiProperty({ description: 'Message id.' })
  id!: string;

  @ApiProperty({ description: 'Owning thread id.' })
  threadId!: string;

  @ApiProperty({ description: 'Sender user id.' })
  senderId!: string;

  @ApiProperty({ description: 'Message body.' })
  body!: string;

  @ApiProperty({
    format: 'date-time',
    nullable: true,
    type: String,
    description: 'When the message was read, if it has been.',
  })
  readAt!: string | null;

  @ApiProperty({ format: 'date-time', type: String })
  createdAt!: string;

  @ApiProperty({ description: 'Whether the caller authored this message.' })
  isMine!: boolean;
}

/** Envelope for the unread-messages badge count. */
export class UnreadCountDto {
  @ApiProperty({ description: 'Total unread messages across all of the caller’s threads.' })
  count!: number;
}

/** Result of marking a thread's incoming messages as read. */
export class MarkReadResultDto {
  @ApiProperty({ description: 'Number of messages marked as read.' })
  readCount!: number;
}

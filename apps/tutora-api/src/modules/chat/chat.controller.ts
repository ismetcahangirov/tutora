import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import { ChatService } from './chat.service';
import type { MessageView, ThreadView } from './chat.types';
import {
  MarkReadResultDto,
  MessageViewDto,
  ThreadViewDto,
  UnreadCountDto,
} from './dto/chat-response.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { StartThreadDto } from './dto/start-thread.dto';

/** Realtime student↔tutor chat (#34). Both roles share these endpoints. */
@ApiTags('chat')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'chat', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('threads')
  @ApiOperation({ summary: "List the caller's chat threads (paginated)" })
  @ApiPaginatedResponse(ThreadViewDto)
  listThreads(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListThreadsQueryDto,
  ): Promise<Paginated<ThreadView>> {
    return this.chat.listThreads(user, query);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Open (or fetch) a thread with a counterparty' })
  @ApiCreatedResponse({ description: 'The opened or existing thread.', type: ThreadViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  openThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartThreadDto,
  ): Promise<ThreadView> {
    return this.chat.openThread(user, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread messages across all threads' })
  @ApiOkResponse({ description: 'The unread message badge count.', type: UnreadCountDto })
  unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    return this.chat.unreadCount(user);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: "List a thread's messages (paginated, newest first)" })
  @ApiParam({ name: 'id', description: 'Thread id.' })
  @ApiPaginatedResponse(MessageViewDto)
  @ApiStandardErrorResponses('notFound')
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<Paginated<MessageView>> {
    return this.chat.listMessages(user, id, query);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message in a thread' })
  @ApiParam({ name: 'id', description: 'Thread id.' })
  @ApiCreatedResponse({ description: 'The sent message.', type: MessageViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageView> {
    return this.chat.sendMessage(user, id, dto);
  }

  @Post('threads/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark a thread's incoming messages as read" })
  @ApiParam({ name: 'id', description: 'Thread id.' })
  @ApiOkResponse({ description: 'How many messages were marked read.', type: MarkReadResultDto })
  @ApiStandardErrorResponses('notFound')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ readCount: number }> {
    return this.chat.markRead(user, id);
  }
}

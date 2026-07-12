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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { ChatService } from './chat.service';
import type { MessageView, ThreadView } from './chat.types';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { StartThreadDto } from './dto/start-thread.dto';

/** Realtime student↔tutor chat (#34). Both roles share these endpoints. */
@ApiTags('chat')
@ApiBearerAuth('bearer')
@Controller({ path: 'chat', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('threads')
  @ApiOperation({ summary: "List the caller's chat threads (paginated)" })
  listThreads(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListThreadsQueryDto,
  ): Promise<Paginated<ThreadView>> {
    return this.chat.listThreads(user, query);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Open (or fetch) a thread with a counterparty' })
  openThread(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartThreadDto,
  ): Promise<ThreadView> {
    return this.chat.openThread(user, dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Total unread messages across all threads' })
  unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    return this.chat.unreadCount(user);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: "List a thread's messages (paginated, newest first)" })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<Paginated<MessageView>> {
    return this.chat.listMessages(user, id, query);
  }

  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send a message in a thread' })
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
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ readCount: number }> {
    return this.chat.markRead(user, id);
  }
}

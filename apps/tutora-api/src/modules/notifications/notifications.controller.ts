import {
  Body,
  Controller,
  Delete,
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
import { NotificationsService } from './notifications.service';
import type { DeviceView, NotificationView } from './notifications.types';
import {
  DeviceViewDto,
  MarkAllReadResultDto,
  NotificationViewDto,
  UnreadCountResultDto,
  UnregisterDeviceResultDto,
} from './dto/notification-response.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

/** The signed-in user's own devices and notification feed (#35). */
@ApiTags('notifications')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('devices')
  @ApiOperation({ summary: 'Register (or re-own) a device push token' })
  @ApiCreatedResponse({ description: 'The registered device.', type: DeviceViewDto })
  @ApiStandardErrorResponses('badRequest')
  registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceDto,
  ): Promise<DeviceView> {
    return this.notifications.registerDevice(user, dto);
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Unregister a device push token' })
  @ApiParam({ name: 'token', description: 'The device push token to remove.' })
  @ApiOkResponse({ description: 'How many tokens were removed.', type: UnregisterDeviceResultDto })
  unregisterDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ): Promise<{ removed: number }> {
    return this.notifications.unregisterDevice(user, token);
  }

  @Get()
  @ApiOperation({ summary: "List the caller's notifications (paginated, newest first)" })
  @ApiPaginatedResponse(NotificationViewDto)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<Paginated<NotificationView>> {
    return this.notifications.list(user, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Number of unread notifications (badge count)' })
  @ApiOkResponse({ description: 'The caller’s unread count.', type: UnreadCountResultDto })
  unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    return this.notifications.unreadCount(user);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({
    description: 'How many notifications were marked read.',
    type: MarkAllReadResultDto,
  })
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ readCount: number }> {
    return this.notifications.markAllRead(user);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification id.' })
  @ApiOkResponse({ description: 'The updated notification.', type: NotificationViewDto })
  @ApiStandardErrorResponses('notFound')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationView> {
    return this.notifications.markRead(user, id);
  }
}

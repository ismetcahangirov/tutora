import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { ApiStandardErrorResponses } from '@common/swagger';
import { NotificationsService } from './notifications.service';
import { BroadcastResultDto } from './dto/notification-response.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';

/** Admin push/notification composer backend (#35 segmentation; consumed by #66). */
@ApiTags('admin: notifications')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/notifications', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a notification to an audience segment' })
  @ApiOkResponse({ description: 'How many recipients were reached.', type: BroadcastResultDto })
  @ApiStandardErrorResponses('badRequest')
  broadcast(@Body() dto: BroadcastNotificationDto): Promise<{ recipients: number }> {
    return this.notifications.broadcast(dto);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { Paginated } from '@common/pagination/page';
import { AuditService } from './audit.service';
import type { AuditLogView } from './audit.types';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

/** Admin-only audit-trail viewer (#71). Read-only; the trail is append-only. */
@ApiTags('admin: audit logs')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/audit-logs', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit-log entries (paginated, filterable)' })
  list(@Query() query: ListAuditLogsQueryDto): Promise<Paginated<AuditLogView>> {
    return this.audit.list(query);
  }
}

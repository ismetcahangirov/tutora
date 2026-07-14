import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import type { DashboardStats } from './dashboard.types';

/** Admin dashboard analytics (#61). Every route requires the ADMIN role. */
@ApiTags('admin: dashboard')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/dashboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'KPIs, tutor-status breakdown, and the signups trend' })
  getStats(): Promise<DashboardStats> {
    return this.dashboard.getStats();
  }
}

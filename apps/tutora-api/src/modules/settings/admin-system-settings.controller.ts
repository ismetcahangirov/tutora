import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { AuditActor } from '@modules/audit/decorators/audit-actor.decorator';
import type { AuditActorContext } from '@modules/audit/audit.types';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import type { SystemSettingView } from './settings.types';
import { SystemSettingsService } from './system-settings.service';

/** Admin-only system-settings management (#70). Every route requires ADMIN. */
@ApiTags('admin: system settings')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/settings', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSystemSettingsController {
  constructor(private readonly systemSettings: SystemSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all system settings' })
  list(): Promise<SystemSettingView[]> {
    return this.systemSettings.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a system setting' })
  create(
    @Body() dto: CreateSystemSettingDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<SystemSettingView> {
    return this.systemSettings.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a system setting (value and/or description)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSystemSettingDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<SystemSettingView> {
    return this.systemSettings.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a system setting' })
  async remove(@Param('id') id: string, @AuditActor() actor: AuditActorContext): Promise<void> {
    await this.systemSettings.remove(id, actor);
  }
}

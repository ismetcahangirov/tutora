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
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';
import type { FeatureFlagView } from './settings.types';

/** Admin-only feature-flag management (#70). Every route requires ADMIN. */
@ApiTags('admin: feature flags')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/feature-flags', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFeatureFlagsController {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags' })
  list(): Promise<FeatureFlagView[]> {
    return this.featureFlags.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  create(
    @Body() dto: CreateFeatureFlagDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<FeatureFlagView> {
    return this.featureFlags.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a feature flag (toggle, rollout, description)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<FeatureFlagView> {
    return this.featureFlags.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a feature flag' })
  async remove(@Param('id') id: string, @AuditActor() actor: AuditActorContext): Promise<void> {
    await this.featureFlags.remove(id, actor);
  }
}

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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { AuditActor } from '@modules/audit/decorators/audit-actor.decorator';
import type { AuditActorContext } from '@modules/audit/audit.types';
import { ApiStandardErrorResponses } from '@common/swagger';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { FeatureFlagViewDto } from './dto/settings-response.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';
import type { FeatureFlagView } from './settings.types';

/** Admin-only feature-flag management (#70). Every route requires ADMIN. */
@ApiTags('admin: feature flags')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/feature-flags', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminFeatureFlagsController {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiOkResponse({ description: 'All feature flags.', type: [FeatureFlagViewDto] })
  list(): Promise<FeatureFlagView[]> {
    return this.featureFlags.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a feature flag' })
  @ApiCreatedResponse({ description: 'The created feature flag.', type: FeatureFlagViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  create(
    @Body() dto: CreateFeatureFlagDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<FeatureFlagView> {
    return this.featureFlags.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a feature flag (toggle, rollout, description)' })
  @ApiParam({ name: 'id', description: 'Feature-flag id.' })
  @ApiOkResponse({ description: 'The updated feature flag.', type: FeatureFlagViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
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
  @ApiParam({ name: 'id', description: 'Feature-flag id.' })
  @ApiNoContentResponse({ description: 'The feature flag was deleted.' })
  @ApiStandardErrorResponses('notFound')
  async remove(@Param('id') id: string, @AuditActor() actor: AuditActorContext): Promise<void> {
    await this.featureFlags.remove(id, actor);
  }
}

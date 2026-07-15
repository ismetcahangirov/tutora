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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { AuditActor } from '@modules/audit/decorators/audit-actor.decorator';
import type { AuditActorContext } from '@modules/audit/audit.types';
import type { Paginated } from '@common/pagination/page';
import type { TranslationView } from './translations.types';
import { TranslationsService } from './translations.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { ListTranslationsQueryDto } from './dto/list-translations-query.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';

/** Admin-only translation management (#85). Every route requires ADMIN. */
@ApiTags('admin: translations')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/translations', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTranslationsController {
  constructor(private readonly translations: TranslationsService) {}

  @Get()
  @ApiOperation({ summary: 'List translation keys (paginated, filterable)' })
  list(@Query() query: ListTranslationsQueryDto): Promise<Paginated<TranslationView>> {
    return this.translations.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a translation key' })
  create(
    @Body() dto: CreateTranslationDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<TranslationView> {
    return this.translations.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a translation key (description, per-locale values)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTranslationDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<TranslationView> {
    return this.translations.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a translation key' })
  async remove(@Param('id') id: string, @AuditActor() actor: AuditActorContext): Promise<void> {
    await this.translations.remove(id, actor);
  }
}

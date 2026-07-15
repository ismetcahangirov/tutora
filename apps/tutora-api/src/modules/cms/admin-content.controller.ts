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
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import type { ContentEntryView } from './cms.types';
import { ContentService } from './content.service';
import { CreateContentEntryDto } from './dto/create-content-entry.dto';
import { ContentEntryViewDto } from './dto/content-response.dto';
import { ListContentEntriesQueryDto } from './dto/list-content-entries-query.dto';
import { UpdateContentEntryDto } from './dto/update-content-entry.dto';

/** Admin-only CMS management (#67). Every route requires ADMIN. */
@ApiTags('admin: content')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/content', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'List content entries (paginated, filterable)' })
  @ApiPaginatedResponse(ContentEntryViewDto)
  @ApiStandardErrorResponses('badRequest')
  list(@Query() query: ListContentEntriesQueryDto): Promise<Paginated<ContentEntryView>> {
    return this.content.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a content entry' })
  @ApiCreatedResponse({ description: 'The created content entry.', type: ContentEntryViewDto })
  @ApiStandardErrorResponses('badRequest', 'conflict')
  create(
    @Body() dto: CreateContentEntryDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<ContentEntryView> {
    return this.content.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content entry (content, order, publish state)' })
  @ApiParam({ name: 'id', description: 'Content entry id.' })
  @ApiOkResponse({ description: 'The updated content entry.', type: ContentEntryViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound', 'conflict')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContentEntryDto,
    @AuditActor() actor: AuditActorContext,
  ): Promise<ContentEntryView> {
    return this.content.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content entry' })
  @ApiParam({ name: 'id', description: 'Content entry id.' })
  @ApiNoContentResponse({ description: 'The content entry was deleted.' })
  @ApiStandardErrorResponses('notFound')
  async remove(@Param('id') id: string, @AuditActor() actor: AuditActorContext): Promise<void> {
    await this.content.remove(id, actor);
  }
}

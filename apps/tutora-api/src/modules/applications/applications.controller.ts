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
import { ApplicationsService } from './applications.service';
import type { ApplicationView } from './applications.types';
import { ApplicationViewDto } from './dto/application-response.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';

/** A student managing their outgoing applications to tutors (#32). */
@ApiTags('applications')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'applications', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Apply to a tutor' })
  @ApiCreatedResponse({ description: 'The created application.', type: ApplicationViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound', 'conflict')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationView> {
    return this.applications.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the student’s own applications (paginated)' })
  @ApiPaginatedResponse(ApplicationViewDto)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListApplicationsQueryDto,
  ): Promise<Paginated<ApplicationView>> {
    return this.applications.listForStudent(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of the student’s own applications' })
  @ApiParam({ name: 'id', description: 'Application id.' })
  @ApiOkResponse({ description: 'The requested application.', type: ApplicationViewDto })
  @ApiStandardErrorResponses('notFound')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApplicationView> {
    return this.applications.getForStudent(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiParam({ name: 'id', description: 'Application id.' })
  @ApiOkResponse({ description: 'The withdrawn application.', type: ApplicationViewDto })
  @ApiStandardErrorResponses('notFound', 'conflict')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApplicationView> {
    return this.applications.cancel(user.id, id);
  }
}

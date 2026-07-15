import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import { AdminStudentsService } from './admin-students.service';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { AdminStudentListItemDto, AdminStudentViewDto } from './dto/student-response.dto';
import type { AdminStudentListItem, AdminStudentView } from './students.types';

/** Admin-only student management (#30). Every route requires the ADMIN role. */
@ApiTags('admin: students')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/students', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStudentsController {
  constructor(private readonly adminStudents: AdminStudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List student profiles (paginated, filterable)' })
  @ApiPaginatedResponse(AdminStudentListItemDto)
  @ApiStandardErrorResponses('badRequest')
  list(@Query() query: ListStudentsQueryDto): Promise<Paginated<AdminStudentListItem>> {
    return this.adminStudents.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student profile' })
  @ApiParam({ name: 'id', description: 'Student profile id.' })
  @ApiOkResponse({ description: 'The requested student profile.', type: AdminStudentViewDto })
  @ApiStandardErrorResponses('notFound')
  getById(@Param('id') id: string): Promise<AdminStudentView> {
    return this.adminStudents.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student profile' })
  @ApiParam({ name: 'id', description: 'Student profile id.' })
  @ApiOkResponse({ description: 'The updated student profile.', type: AdminStudentViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  update(@Param('id') id: string, @Body() dto: UpdateStudentProfileDto): Promise<AdminStudentView> {
    return this.adminStudents.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a student profile' })
  @ApiParam({ name: 'id', description: 'Student profile id.' })
  @ApiNoContentResponse({ description: 'The student profile was soft-deleted.' })
  @ApiStandardErrorResponses('notFound')
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminStudents.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted student profile' })
  @ApiParam({ name: 'id', description: 'Student profile id.' })
  @ApiOkResponse({ description: 'The restored student profile.', type: AdminStudentViewDto })
  @ApiStandardErrorResponses('notFound')
  restore(@Param('id') id: string): Promise<AdminStudentView> {
    return this.adminStudents.restore(id);
  }
}

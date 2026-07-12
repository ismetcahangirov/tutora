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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { Paginated } from '@common/pagination/page';
import { AdminStudentsService } from './admin-students.service';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import type { AdminStudentListItem, AdminStudentView } from './students.types';

/** Admin-only student management (#30). Every route requires the ADMIN role. */
@ApiTags('admin: students')
@ApiBearerAuth('bearer')
@Controller({ path: 'admin/students', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStudentsController {
  constructor(private readonly adminStudents: AdminStudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List student profiles (paginated, filterable)' })
  list(@Query() query: ListStudentsQueryDto): Promise<Paginated<AdminStudentListItem>> {
    return this.adminStudents.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a student profile' })
  getById(@Param('id') id: string): Promise<AdminStudentView> {
    return this.adminStudents.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student profile' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentProfileDto): Promise<AdminStudentView> {
    return this.adminStudents.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a student profile' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminStudents.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted student profile' })
  restore(@Param('id') id: string): Promise<AdminStudentView> {
    return this.adminStudents.restore(id);
  }
}

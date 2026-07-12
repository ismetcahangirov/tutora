import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { ListStudentsQueryDto } from './dto/list-students-query.dto';
import type { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import {
  STUDENT_LIST_SELECT,
  STUDENT_PROFILE_INCLUDE,
  toAdminStudentListItem,
  toAdminStudentView,
} from './students.mapper';
import type { AdminStudentListItem, AdminStudentView } from './students.types';

/** Administrative student management (#30). Every route requires the ADMIN role. */
@Injectable()
export class AdminStudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListStudentsQueryDto): Promise<Paginated<AdminStudentListItem>> {
    const where: Prisma.StudentProfileWhereInput = {};
    if (!query.includeDeleted) {
      where.deletedAt = null;
    }
    if (query.educationLevel) {
      where.educationLevel = query.educationLevel;
    }
    if (query.q) {
      where.user = {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
        ],
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.studentProfile.findMany({
        where,
        select: STUDENT_LIST_SELECT,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return buildPage(rows.map(toAdminStudentListItem), total, query.page, query.limit);
  }

  async getById(id: string): Promise<AdminStudentView> {
    return toAdminStudentView(await this.findOrThrow(id));
  }

  async update(id: string, dto: UpdateStudentProfileDto): Promise<AdminStudentView> {
    await this.findOrThrow(id);
    const data: Prisma.StudentProfileUpdateInput = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.educationLevel !== undefined) data.educationLevel = dto.educationLevel;

    const updated = await this.prisma.studentProfile.update({
      where: { id },
      data,
      include: STUDENT_PROFILE_INCLUDE,
    });
    return toAdminStudentView(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.studentProfile.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<AdminStudentView> {
    await this.findOrThrow(id);
    const updated = await this.prisma.studentProfile.update({
      where: { id },
      data: { deletedAt: null },
      include: STUDENT_PROFILE_INCLUDE,
    });
    return toAdminStudentView(updated);
  }

  private async findOrThrow(id: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: STUDENT_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }
    return profile;
  }
}

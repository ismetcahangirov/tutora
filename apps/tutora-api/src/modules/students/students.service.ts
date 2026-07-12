import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import {
  FAVORITE_INCLUDE,
  STUDENT_PROFILE_INCLUDE,
  type StudentProfileWithRelations,
  toFavoriteTutorView,
  toStudentProfileView,
} from './students.mapper';
import type { FavoriteTutorView, StudentProfileView } from './students.types';

/** Student profile, preferences and favorites (#30). */
@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the caller's own profile, creating an empty shell on first access. */
  async getOwnProfile(userId: string): Promise<StudentProfileView> {
    return toStudentProfileView(await this.ensureProfile(userId));
  }

  /** Applies a partial update to the caller's preferences. */
  async updateOwnProfile(
    userId: string,
    dto: UpdateStudentProfileDto,
  ): Promise<StudentProfileView> {
    await this.ensureProfile(userId);

    const data: Prisma.StudentProfileUpdateInput = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.educationLevel !== undefined) data.educationLevel = dto.educationLevel;

    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data,
      include: STUDENT_PROFILE_INCLUDE,
    });
    return toStudentProfileView(updated);
  }

  /** Paginated list of the tutors the caller has favorited, newest first. */
  async listFavorites(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<FavoriteTutorView>> {
    const profile = await this.ensureProfile(userId);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where: { studentId: profile.id },
        include: FAVORITE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.favorite.count({ where: { studentId: profile.id } }),
    ]);

    return buildPage(rows.map(toFavoriteTutorView), total, query.page, query.limit);
  }

  /** Idempotently favorites a tutor. The tutor must exist and not be deleted. */
  async addFavorite(userId: string, tutorId: string): Promise<void> {
    const profile = await this.ensureProfile(userId);
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: tutorId, deletedAt: null },
      select: { id: true },
    });
    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }
    await this.prisma.favorite.upsert({
      where: { studentId_tutorId: { studentId: profile.id, tutorId } },
      create: { studentId: profile.id, tutorId },
      update: {},
    });
  }

  /** Removes a favorite. Idempotent — removing a non-favorite is a no-op. */
  async removeFavorite(userId: string, tutorId: string): Promise<void> {
    const profile = await this.ensureProfile(userId);
    await this.prisma.favorite.deleteMany({ where: { studentId: profile.id, tutorId } });
  }

  /**
   * Get-or-create the caller's profile with relations. Handles the create race
   * (two concurrent first-writes) via the unique index on `userId`.
   */
  private async ensureProfile(userId: string): Promise<StudentProfileWithRelations> {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: STUDENT_PROFILE_INCLUDE,
    });
    if (existing) {
      return existing;
    }
    try {
      return await this.prisma.studentProfile.create({
        data: { userId },
        include: STUDENT_PROFILE_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.studentProfile.findUnique({
          where: { userId },
          include: STUDENT_PROFILE_INCLUDE,
        });
        if (raced) return raced;
      }
      throw error;
    }
  }
}

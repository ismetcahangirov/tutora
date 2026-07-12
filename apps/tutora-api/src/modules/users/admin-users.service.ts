import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { AdminCreateUserDto } from './dto/admin-create-user.dto';
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import { type AdminUserView, toAdminUserView } from './users.types';

/**
 * Administrative user management (#28). Separated from `UsersService` — which
 * owns identity and self-service — so each stays single-responsibility. Every
 * route that reaches this service is gated by `RolesGuard` + `@Roles(ADMIN)`.
 */
@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Paginated, filterable listing. Soft-deleted accounts are hidden by default. */
  async list(query: ListUsersQueryDto): Promise<Paginated<AdminUserView>> {
    const where: Prisma.UserWhereInput = {};
    if (!query.includeDeleted) {
      where.deletedAt = null;
    }
    if (query.role) {
      where.role = query.role;
    }
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPage(rows.map(toAdminUserView), total, query.page, query.limit);
  }

  /** Returns a single account (including soft-deleted) or throws `NotFound`. */
  async getById(id: string): Promise<AdminUserView> {
    return toAdminUserView(await this.findOrThrow(id));
  }

  /**
   * Provisions a shell account by email. The row is linked to a real identity on
   * the user's first Google sign-in (`UsersService.upsertFromGoogle`). Pre-set
   * roles skip onboarding. Rejects a duplicate email with `409`.
   */
  async create(dto: AdminCreateUserDto): Promise<AdminUserView> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        role: dto.role,
        name: dto.name,
        locale: dto.locale,
        onboardingCompleted: dto.role !== undefined,
      },
    });
    return toAdminUserView(user);
  }

  /** Partial admin update. May set any role and toggle lifecycle flags. */
  async update(id: string, dto: AdminUpdateUserDto): Promise<AdminUserView> {
    await this.findOrThrow(id);
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.emailVerified !== undefined) data.emailVerified = dto.emailVerified;
    if (dto.onboardingCompleted !== undefined) data.onboardingCompleted = dto.onboardingCompleted;

    const user = await this.prisma.user.update({ where: { id }, data });
    return toAdminUserView(user);
  }

  /** Soft-deletes an account and revokes its outstanding refresh tokens. */
  async softDelete(id: string): Promise<void> {
    await this.findOrThrow(id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  /** Restores a soft-deleted account by clearing `deletedAt`. */
  async restore(id: string): Promise<AdminUserView> {
    await this.findOrThrow(id);
    const user = await this.prisma.user.update({ where: { id }, data: { deletedAt: null } });
    return toAdminUserView(user);
  }

  /** Loads a user by id or throws a clean `404` (used before mutating writes). */
  private async findOrThrow(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

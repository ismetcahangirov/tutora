import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { GoogleProfile, UserSummary } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a non-sensitive summary of the user for profile endpoints.
   * Throws `NotFoundException` (fail closed) if the id no longer exists — e.g.
   * a still-valid token for a deleted account.
   */
  async getSummaryById(id: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  /**
   * Finds a user by Google id, links Google to an existing email account, or
   * creates a fresh account. New accounts have no role until onboarding (#23).
   */
  async upsertFromGoogle(profile: GoogleProfile): Promise<User> {
    const byGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: profile.googleId,
          name: byEmail.name ?? profile.name,
          avatarUrl: byEmail.avatarUrl ?? profile.picture,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        emailVerified: true,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.picture,
        locale: profile.locale,
        provider: 'GOOGLE',
      },
    });
  }
}

import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import type { User, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@modules/mail/mail.service';
import type { GoogleProfile, UserSummary } from './users.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    // Optional so units/integration suites that don't wire the mailer still
    // resolve UsersService; in the running app MailModule is global.
    @Optional() private readonly mail?: MailService,
  ) {}

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
    return this.toSummary(user);
  }

  /**
   * Persists the onboarding role choice (#23): sets the role and flips
   * `onboardingCompleted`. Callers must restrict `role` to selectable values
   * (see `UpdateMeDto`) — ADMIN is never assignable here.
   */
  async completeOnboarding(id: string, role: UserRole): Promise<UserSummary> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role, onboardingCompleted: true },
    });
    return this.toSummary(user);
  }

  /** Non-sensitive projection shared by every user-facing endpoint. */
  private toSummary(user: User): UserSummary {
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

    const created = await this.prisma.user.create({
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
    this.sendWelcomeEmail(created);
    return created;
  }

  /**
   * Fire-and-forget welcome email for a newly created account (#84). A mail
   * failure must never block or fail sign-up, so it is logged, not thrown.
   */
  private sendWelcomeEmail(user: User): void {
    if (!this.mail) {
      return;
    }
    void this.mail
      .sendWelcomeEmail({ email: user.email, name: user.name, locale: user.locale })
      .catch((error: unknown) =>
        this.logger.error(`Failed to send welcome email to ${user.email}`, error),
      );
  }
}

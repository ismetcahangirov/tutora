import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@modules/mail/mail.service';
import type { UpdateMeDto } from './dto/update-me.dto';
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
   * Fails closed with `NotFoundException` if the id no longer exists or the
   * account was soft-deleted — e.g. a still-valid token for a removed account.
   */
  async getSummaryById(id: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
    return this.toSummary(user);
  }

  /**
   * Updates the authenticated user's own editable fields. Every field is
   * optional; supplying `role` also completes onboarding (#23) — but only
   * once. The id always comes from the verified token, never the client, and
   * `UpdateMeDto` rejects non-selectable roles so this endpoint cannot escalate
   * privilege *to* ADMIN. Without also checking the user's current state, it
   * could still silently downgrade an out-of-band role (ADMIN, or a repeat
   * onboarding call) to STUDENT/TUTOR — so a role change is refused once
   * onboarding is already complete.
   */
  async updateMe(id: string, dto: UpdateMeDto): Promise<UserSummary> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.role !== undefined) {
      const current = await this.prisma.user.findUnique({ where: { id } });
      if (!current) {
        throw new NotFoundException('User not found');
      }
      if (current.onboardingCompleted) {
        throw new ForbiddenException('Role can only be chosen once, during onboarding');
      }
      data.role = dto.role;
      data.onboardingCompleted = true;
    }
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toSummary(user);
  }

  /**
   * Soft-deletes the authenticated user's account (account lifecycle, #28):
   * stamps `deletedAt` and revokes every outstanding refresh token so existing
   * sessions cannot be silently refreshed. Access tokens expire on their own
   * short TTL. Atomic so an account is never left half-deactivated.
   */
  async deactivateAccount(id: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
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

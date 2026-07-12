import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { toDeviceView, toNotificationView } from './notifications.mapper';
import { PushService } from './push.service';
import {
  NotificationAudience,
  type DeviceView,
  type NotificationView,
  type NotifyInput,
  type PushPayload,
} from './notifications.types';
import type { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import type { RegisterDeviceDto } from './dto/register-device.dto';

/**
 * In-app notifications and push delivery (#35).
 *
 * Persistence and authorization live here; {@link PushService} only talks to FCM.
 * The `notify*` / `broadcast` methods are the reusable API other modules call to
 * raise notifications — each writes one in-app record per recipient and pushes to
 * their devices. Push is best-effort: a transport failure never fails the caller
 * and never rolls back the in-app write.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  // ── Devices ────────────────────────────────────────────────────────────────

  /** Registers (or re-owns) an FCM token for the caller's device. */
  async registerDevice(user: AuthenticatedUser, dto: RegisterDeviceDto): Promise<DeviceView> {
    const device = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { userId: user.id, token: dto.token, platform: dto.platform },
      update: { userId: user.id, platform: dto.platform, lastUsedAt: new Date() },
    });
    return toDeviceView(device);
  }

  /** Removes one of the caller's registered tokens (e.g. on logout). Idempotent. */
  async unregisterDevice(user: AuthenticatedUser, token: string): Promise<{ removed: number }> {
    const { count } = await this.prisma.deviceToken.deleteMany({
      where: { token, userId: user.id },
    });
    return { removed: count };
  }

  // ── In-app feed ──────────────────────────────────────────────────────────────

  /** The caller's notifications, newest first, optionally unread-only. */
  async list(
    user: AuthenticatedUser,
    query: ListNotificationsQueryDto,
  ): Promise<Paginated<NotificationView>> {
    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return buildPage(rows.map(toNotificationView), total, query.page, query.limit);
  }

  /** The caller's unread count (badge). */
  async unreadCount(user: AuthenticatedUser): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });
    return { count };
  }

  /** Marks one of the caller's notifications read. Idempotent; 404 if not theirs. */
  async markRead(user: AuthenticatedUser, id: string): Promise<NotificationView> {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    if (existing.readAt) {
      return toNotificationView(existing);
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return toNotificationView(updated);
  }

  /** Marks every unread notification of the caller read. */
  async markAllRead(user: AuthenticatedUser): Promise<{ readCount: number }> {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { readCount: count };
  }

  // ── Dispatch (reusable API) ──────────────────────────────────────────────────

  /** Raises a notification for a single user and pushes it to their devices. */
  async notifyUser(userId: string, input: NotifyInput): Promise<NotificationView> {
    const type = input.type ?? NotificationType.SYSTEM;
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title: input.title,
        body: input.body,
        ...(input.data !== undefined ? { data: input.data } : {}),
      },
    });
    await this.pushToUsers([userId], {
      title: input.title,
      body: input.body,
      data: { type, notificationId: notification.id },
    });
    return toNotificationView(notification);
  }

  /**
   * Sends a notification to an audience segment (#35 segmentation). Fans out to
   * one in-app record per recipient and pushes to all their devices.
   */
  async broadcast(dto: BroadcastNotificationDto): Promise<{ recipients: number }> {
    const type = dto.type ?? NotificationType.ANNOUNCEMENT;
    const users = await this.prisma.user.findMany({
      where: this.audienceWhere(dto.audience),
      select: { id: true },
    });
    if (users.length === 0) {
      return { recipients: 0 };
    }

    const rows: Prisma.NotificationCreateManyInput[] = users.map((u) => ({
      userId: u.id,
      type,
      title: dto.title,
      body: dto.body,
      ...(dto.data !== undefined ? { data: dto.data as Prisma.InputJsonValue } : {}),
    }));
    await this.prisma.notification.createMany({ data: rows });

    await this.pushToUsers(
      users.map((u) => u.id),
      { title: dto.title, body: dto.body, data: { type } },
    );
    return { recipients: users.length };
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  /** Resolves the `User` filter for an audience segment. */
  private audienceWhere(audience: NotificationAudience): Prisma.UserWhereInput {
    const base: Prisma.UserWhereInput = { deletedAt: null };
    switch (audience) {
      case NotificationAudience.STUDENTS:
        return { ...base, role: UserRole.STUDENT };
      case NotificationAudience.TUTORS:
        return { ...base, role: UserRole.TUTOR };
      case NotificationAudience.ALL:
        return { ...base, role: { not: null } };
    }
  }

  /**
   * Pushes to every device of the given users and prunes tokens FCM rejects as
   * dead. Best-effort: never throws, so a transport hiccup can't fail the caller.
   */
  private async pushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!this.push.isConfigured || userIds.length === 0) {
      return;
    }
    try {
      const devices = await this.prisma.deviceToken.findMany({
        where: { userId: { in: userIds } },
        select: { token: true },
      });
      const tokens = devices.map((device) => device.token);
      if (tokens.length === 0) {
        return;
      }
      const result = await this.push.sendToTokens(tokens, payload);
      if (result.invalidTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: result.invalidTokens } },
        });
      }
    } catch (error) {
      this.logger.error(`Push fan-out failed: ${(error as Error).message}`);
    }
  }
}

import { NotificationType } from '@prisma/client';
import type { I18nService } from 'nestjs-i18n';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { TutorDigestService } from './tutor-digest.service';

/** Builds a selected application row shaped like the service's `select`. */
function appRow(userId: string, locale: string | null) {
  return { tutor: { userId, user: { locale } } };
}

function build(rows: ReturnType<typeof appRow>[]) {
  const prisma = {
    application: { findMany: jest.fn().mockResolvedValue(rows) },
  };
  const notifications = { notifyUser: jest.fn().mockResolvedValue(undefined) };
  const i18n = { translate: jest.fn((key: string) => key) };
  const service = new TutorDigestService(
    prisma as unknown as PrismaService,
    notifications as unknown as NotificationsService,
    i18n as unknown as I18nService,
  );
  return { service, prisma, notifications, i18n };
}

describe('TutorDigestService', () => {
  const now = new Date('2026-07-12T08:00:00.000Z');

  it('sends one digest per tutor, aggregating their new applications', async () => {
    const { service, notifications } = build([
      appRow('tutor-a', 'en'),
      appRow('tutor-a', 'en'),
      appRow('tutor-b', 'ru'),
    ]);

    await expect(service.run(now)).resolves.toEqual({ tutorsNotified: 2, applications: 3 });

    expect(notifications.notifyUser).toHaveBeenCalledTimes(2);
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      'tutor-a',
      expect.objectContaining({ type: NotificationType.APPLICATION }),
    );
  });

  it('localizes each digest to the tutor locale with the application count', async () => {
    const { service, notifications, i18n } = build([
      appRow('tutor-a', 'ru'),
      appRow('tutor-a', 'ru'),
    ]);

    await service.run(now);

    // Count is passed to the body translation for interpolation.
    expect(i18n.translate).toHaveBeenCalledWith('notifications.digest.applications.body', {
      lang: 'ru',
      args: { count: 2 },
    });
    expect(notifications.notifyUser).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default language for an unknown locale', async () => {
    const { service, i18n } = build([appRow('tutor-a', null)]);

    await service.run(now);

    expect(i18n.translate).toHaveBeenCalledWith(
      'notifications.digest.applications.title',
      expect.objectContaining({ lang: 'az' }),
    );
  });

  it('only looks at pending applications inside the lookback window', async () => {
    const { service, prisma } = build([]);

    await service.run(now);

    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PENDING', createdAt: { gte: new Date('2026-07-11T08:00:00.000Z') } },
      }),
    );
  });

  it('notifies nobody when there are no new applications', async () => {
    const { service, notifications } = build([]);

    await expect(service.run(now)).resolves.toEqual({ tutorsNotified: 0, applications: 0 });
    expect(notifications.notifyUser).not.toHaveBeenCalled();
  });
});

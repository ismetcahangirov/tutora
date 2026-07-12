import { Injectable, Logger } from '@nestjs/common';
import { ApplicationStatus, NotificationType } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '@/prisma/prisma.service';
import { toSupportedLanguage, type SupportedLanguage } from '@/i18n/i18n.config';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { subtractHours } from '@common/utils/time';
import { DIGEST_LOOKBACK_HOURS } from '../jobs.constants';
import type { TutorDigestResult } from '../jobs.types';

/** New-application counts and locale for one tutor, keyed by their user id. */
interface TutorDigestEntry {
  count: number;
  locale: string | null;
}

/**
 * Daily tutor digest (#38 digests).
 *
 * Groups the applications raised in the lookback window by tutor and sends each
 * one a single localized in-app notification (+ push) summarizing how many new
 * requests await a response — one digest instead of a ping per application.
 * Reuses {@link NotificationsService.notifyUser}, the documented cross-module API.
 */
@Injectable()
export class TutorDigestService {
  private readonly logger = new Logger(TutorDigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly i18n: I18nService,
  ) {}

  /** Notifies every tutor with new pending applications since the lookback. */
  async run(now: Date = new Date()): Promise<TutorDigestResult> {
    const since = subtractHours(now, DIGEST_LOOKBACK_HOURS);
    const applications = await this.prisma.application.findMany({
      where: { status: ApplicationStatus.PENDING, createdAt: { gte: since } },
      select: { tutor: { select: { userId: true, user: { select: { locale: true } } } } },
    });

    if (applications.length === 0) {
      return { tutorsNotified: 0, applications: 0 };
    }

    const perTutor = new Map<string, TutorDigestEntry>();
    for (const { tutor } of applications) {
      const entry = perTutor.get(tutor.userId);
      if (entry) {
        entry.count += 1;
      } else {
        perTutor.set(tutor.userId, { count: 1, locale: tutor.user.locale });
      }
    }

    for (const [userId, { count, locale }] of perTutor) {
      const lang = toSupportedLanguage(locale);
      await this.notifications.notifyUser(userId, {
        type: NotificationType.APPLICATION,
        title: this.t('notifications.digest.applications.title', lang),
        body: this.t('notifications.digest.applications.body', lang, { count }),
      });
    }

    this.logger.log(
      `Tutor digest notified ${perTutor.size} tutors of ${applications.length} new applications`,
    );
    return { tutorsNotified: perTutor.size, applications: applications.length };
  }

  /**
   * Thin wrapper over `I18nService.translate`. The cast is safe: every catalog
   * value under these keys is a string, but the library widens the return type
   * when the key is a non-literal `string`.
   */
  private t(key: string, lang: SupportedLanguage, args?: Record<string, unknown>): string {
    return this.i18n.translate(key, { lang, args });
  }
}

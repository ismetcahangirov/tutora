import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { I18nService } from 'nestjs-i18n';
import { toSupportedLanguage, type SupportedLanguage } from '@/i18n/i18n.config';
import type { MailMessage, WelcomeRecipient } from './mail.types';

/**
 * Sends transactional email, localized to the recipient's language (epic #81).
 *
 * Transport is configured from `SMTP_*` env. When SMTP is not configured (local
 * dev, tests, CI) it falls back to nodemailer's JSON transport, which composes
 * the message without touching the network — so features that trigger email
 * never fail for want of credentials.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly smtpConfigured: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    this.from = this.config.get<string>('MAIL_FROM') ?? 'Tutora <no-reply@tutora.app>';
    this.smtpConfigured = Boolean(host);

    if (host) {
      const user = this.config.get<string>('SMTP_USER');
      const pass = this.config.get<string>('SMTP_PASS');
      this.transporter = createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: this.config.get<boolean>('SMTP_SECURE') ?? false,
        auth: user && pass ? { user, pass } : undefined,
      });
    } else {
      this.transporter = createTransport({ jsonTransport: true });
    }
  }

  /** Sends the localized welcome email to a freshly created account (#84). */
  async sendWelcomeEmail(recipient: WelcomeRecipient): Promise<void> {
    const lang = toSupportedLanguage(recipient.locale);
    const name = recipient.name?.trim() || this.t('mail.common.defaultName', lang);

    const subject = this.t('mail.welcome.subject', lang);
    const html = [
      `<p>${this.t('mail.welcome.greeting', lang, { name })}</p>`,
      `<p>${this.t('mail.welcome.intro', lang)}</p>`,
      `<p>${this.t('mail.welcome.body', lang)}</p>`,
      `<p><strong>${this.t('mail.welcome.cta', lang)}</strong></p>`,
      `<p>${this.t('mail.welcome.signature', lang)}</p>`,
    ].join('\n');

    await this.send({ to: recipient.email, subject, html });
  }

  /** Low-level send. Logs (never throws) when SMTP is not configured. */
  private async send(message: MailMessage): Promise<void> {
    if (!this.smtpConfigured) {
      this.logger.debug(`SMTP not configured — email for ${message.to} was not delivered.`);
    }
    await this.transporter.sendMail({ from: this.from, ...message });
  }

  /**
   * Thin wrapper over `I18nService.translate`. The cast is safe: every catalog
   * value under these keys is a string, but the library widens the return type
   * to `unknown` when the key is a non-literal `string`.
   */
  private t(key: string, lang: SupportedLanguage, args?: Record<string, unknown>): string {
    return this.i18n.translate(key, { lang, args });
  }
}

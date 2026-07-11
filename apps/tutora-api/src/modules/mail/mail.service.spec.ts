import { createTransport } from 'nodemailer';
import { MailService } from './mail.service';
import type { MailMessage } from './mail.types';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const createTransportMock = createTransport as jest.Mock;

type SentMail = MailMessage & { from: string };

describe('MailService', () => {
  let lastMessage: SentMail | undefined;
  const sendMail = jest.fn((message: SentMail) => {
    lastMessage = message;
    return Promise.resolve({ messageId: 'test' });
  });
  // Mirrors the resolved language + key back so tests can assert both cheaply.
  const i18n = {
    translate: jest.fn((key: string, opts?: { lang?: string }) => `[${opts?.lang}]${key}`),
  };

  function configFor(values: Record<string, unknown>) {
    return { get: jest.fn((key: string) => values[key]) };
  }

  function build(values: Record<string, unknown> = {}) {
    return new MailService(configFor(values) as never, i18n as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    lastMessage = undefined;
    createTransportMock.mockReturnValue({ sendMail });
  });

  it('falls back to a no-network transport and still composes a localized email when SMTP is unset', async () => {
    const service = build();
    expect(createTransportMock).toHaveBeenCalledWith({ jsonTransport: true });

    await service.sendWelcomeEmail({ email: 'ada@example.com', name: 'Ada', locale: 'ru' });

    expect(i18n.translate).toHaveBeenCalledWith('mail.welcome.subject', {
      lang: 'ru',
      args: undefined,
    });
    expect(lastMessage?.to).toBe('ada@example.com');
    expect(lastMessage?.subject).toBe('[ru]mail.welcome.subject');
    expect(lastMessage?.html).toContain('[ru]mail.welcome.greeting');
    expect(lastMessage?.from).toBe('Tutora <no-reply@tutora.app>');
  });

  it('configures an SMTP transport from env and honors MAIL_FROM', async () => {
    const service = build({
      SMTP_HOST: 'smtp.test',
      SMTP_PORT: 2525,
      SMTP_SECURE: false,
      MAIL_FROM: 'Tutora <hi@tutora.app>',
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.test', port: 2525, secure: false }),
    );

    await service.sendWelcomeEmail({ email: 'ada@example.com', name: null, locale: null });

    // null locale -> default language (az); null name -> localized default name.
    expect(i18n.translate).toHaveBeenCalledWith('mail.common.defaultName', {
      lang: 'az',
      args: undefined,
    });
    expect(lastMessage?.from).toBe('Tutora <hi@tutora.app>');
  });

  it('maps a regional locale to its base supported language', async () => {
    const service = build();
    await service.sendWelcomeEmail({ email: 'ada@example.com', name: 'Ada', locale: 'en-US' });
    expect(i18n.translate).toHaveBeenCalledWith('mail.welcome.subject', {
      lang: 'en',
      args: undefined,
    });
  });
});

import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Provides the localized mailer app-wide (`@Global()`) so any feature can send
 * transactional email without importing this module explicitly. Depends on the
 * global `I18nService` (see `AppI18nModule`) and `ConfigService`.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

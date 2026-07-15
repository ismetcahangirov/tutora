import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AuditModule } from '@modules/audit/audit.module';
import { AdminTranslationsController } from './admin-translations.controller';
import { TranslationsPublicController } from './translations-public.controller';
import { TranslationsService } from './translations.service';

/**
 * Translation management (#85): the over-the-air localization layer. Exposes an
 * admin CRUD surface and a public read surface for the apps. Depends on
 * {@link AuditModule} so every translation change is recorded to the trail.
 */
@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AdminTranslationsController, TranslationsPublicController],
  providers: [TranslationsService],
})
export class TranslationsModule {}

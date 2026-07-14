import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@config/env';
import { AppI18nModule } from '@/i18n/i18n.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { CacheModule } from '@common/cache/cache.module';
import { ThrottlingModule } from '@common/throttler/throttling.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MailModule } from '@modules/mail/mail.module';
import { UsersModule } from '@modules/users/users.module';
import { TutorsModule } from '@modules/tutors/tutors.module';
import { StudentsModule } from '@modules/students/students.module';
import { TaxonomyModule } from '@modules/taxonomy/taxonomy.module';
import { SearchModule } from '@modules/search/search.module';
import { ApplicationsModule } from '@modules/applications/applications.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { ChatModule } from '@modules/chat/chat.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { BillingModule } from '@modules/billing/billing.module';
import { MediaModule } from '@modules/media/media.module';
import { JobsModule } from '@modules/jobs/jobs.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    AppI18nModule,
    RedisModule,
    CacheModule,
    ThrottlingModule,
    MailModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TutorsModule,
    StudentsModule,
    TaxonomyModule,
    SearchModule,
    ApplicationsModule,
    ReviewsModule,
    ChatModule,
    NotificationsModule,
    BillingModule,
    MediaModule,
    JobsModule,
    DashboardModule,
    AuditModule,
    SettingsModule,
    HealthModule,
  ],
})
export class AppModule {}

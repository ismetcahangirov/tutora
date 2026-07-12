import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@config/env';
import { AppI18nModule } from '@/i18n/i18n.module';
import { PrismaModule } from '@/prisma/prisma.module';
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
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    AppI18nModule,
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
    HealthModule,
  ],
})
export class AppModule {}

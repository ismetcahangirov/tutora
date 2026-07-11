import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@config/env';
import { AppI18nModule } from '@/i18n/i18n.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@modules/auth/auth.module';
import { MailModule } from '@modules/mail/mail.module';
import { UsersModule } from '@modules/users/users.module';
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
    HealthModule,
  ],
})
export class AppModule {}

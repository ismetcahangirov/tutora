import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AuditModule } from '@modules/audit/audit.module';
import { AdminFeatureFlagsController } from './admin-feature-flags.controller';
import { AdminSystemSettingsController } from './admin-system-settings.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { SystemSettingsService } from './system-settings.service';

/**
 * Platform configuration (#70): feature flags and system settings. Depends on
 * {@link AuditModule} so every configuration change is recorded to the trail.
 */
@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AdminFeatureFlagsController, AdminSystemSettingsController],
  providers: [FeatureFlagsService, SystemSettingsService],
})
export class SettingsModule {}

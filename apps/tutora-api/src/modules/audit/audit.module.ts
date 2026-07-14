import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminAuditController } from './admin-audit.controller';
import { AuditService } from './audit.service';

/**
 * Audit trail (#71). Exports {@link AuditService} so any feature module can
 * record privileged actions; the admin controller exposes the read-only viewer.
 */
@Module({
  imports: [AuthModule],
  controllers: [AdminAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

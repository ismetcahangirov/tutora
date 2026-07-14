import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AuditModule } from '@modules/audit/audit.module';
import { AdminContentController } from './admin-content.controller';
import { ContentPublicController } from './content-public.controller';
import { ContentService } from './content.service';

/**
 * Content management (#67): landing sections, FAQ, and blog posts. Exposes an
 * admin CRUD surface and a public read surface for the marketing site. Depends
 * on {@link AuditModule} so every content change is recorded to the trail.
 */
@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AdminContentController, ContentPublicController],
  providers: [ContentService],
})
export class CmsModule {}

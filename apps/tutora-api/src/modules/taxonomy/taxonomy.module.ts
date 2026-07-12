import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminTaxonomyController } from './admin-taxonomy.controller';
import { TaxonomyPublicController } from './taxonomy-public.controller';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [AuthModule],
  controllers: [TaxonomyPublicController, AdminTaxonomyController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}

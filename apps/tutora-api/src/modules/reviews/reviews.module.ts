import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { TutorReviewsController } from './tutor-reviews.controller';

/** Post-session reviews, ratings and moderation hooks (#33). */
@Module({
  imports: [AuthModule],
  controllers: [ReviewsController, TutorReviewsController, AdminReviewsController],
  providers: [ReviewsService, AdminReviewsService],
})
export class ReviewsModule {}

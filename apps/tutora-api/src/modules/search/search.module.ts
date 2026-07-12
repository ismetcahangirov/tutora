import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

/** Public tutor discovery (#31). No auth — search is open to anonymous users. */
@Module({
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

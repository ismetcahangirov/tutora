import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TutorsService } from './tutors.service';
import type { PublicTutorView } from './tutors.types';

/**
 * Public tutor detail (#29). Unauthenticated; only published, verified profiles
 * resolve. Broad discovery/search is a separate concern (#31). Registered after
 * `TutorsController` so its `:id` param never shadows the `/tutors/me` routes.
 */
@ApiTags('tutors')
@Controller({ path: 'tutors', version: '1' })
export class TutorPublicController {
  constructor(private readonly tutors: TutorsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a public tutor profile by id' })
  getById(@Param('id') id: string): Promise<PublicTutorView> {
    return this.tutors.getPublicById(id);
  }
}

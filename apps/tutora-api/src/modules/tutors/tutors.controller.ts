import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { AddTutorDistrictDto } from './dto/add-tutor-district.dto';
import { AddTutorLanguageDto } from './dto/add-tutor-language.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { UpsertTutorSubjectDto } from './dto/upsert-tutor-subject.dto';
import { TutorAvailabilityService } from './tutor-availability.service';
import { TutorRelationsService } from './tutor-relations.service';
import { TutorsService } from './tutors.service';
import type { AvailabilitySlotView, CertificateView, TutorProfileView } from './tutors.types';

/**
 * A tutor managing their own profile (#29). Every route requires the TUTOR role;
 * the profile is resolved from the token, never from the client. Registered
 * before `TutorPublicController` so `/tutors/me` matches ahead of `/tutors/:id`.
 */
@ApiTags('tutors')
@ApiBearerAuth('bearer')
@Controller({ path: 'tutors', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TUTOR)
export class TutorsController {
  constructor(
    private readonly tutors: TutorsService,
    private readonly relations: TutorRelationsService,
    private readonly availability: TutorAvailabilityService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated tutor profile' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<TutorProfileView> {
    return this.tutors.getOwnProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated tutor profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTutorProfileDto,
  ): Promise<TutorProfileView> {
    return this.tutors.updateOwnProfile(user.id, dto);
  }

  @Post('me/verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit the profile for admin verification' })
  submitVerification(@CurrentUser() user: AuthenticatedUser): Promise<TutorProfileView> {
    return this.tutors.submitForVerification(user.id);
  }

  @Put('me/subjects')
  @ApiOperation({ summary: 'Add or update a taught subject' })
  upsertSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertTutorSubjectDto,
  ): Promise<TutorProfileView> {
    return this.relations.upsertSubject(user.id, dto);
  }

  @Delete('me/subjects/:subjectId')
  @ApiOperation({ summary: 'Remove a taught subject' })
  removeSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subjectId') subjectId: string,
  ): Promise<TutorProfileView> {
    return this.relations.removeSubject(user.id, subjectId);
  }

  @Put('me/districts')
  @ApiOperation({ summary: 'Add a service district' })
  addDistrict(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddTutorDistrictDto,
  ): Promise<TutorProfileView> {
    return this.relations.addDistrict(user.id, dto.districtId);
  }

  @Delete('me/districts/:districtId')
  @ApiOperation({ summary: 'Remove a service district' })
  removeDistrict(
    @CurrentUser() user: AuthenticatedUser,
    @Param('districtId') districtId: string,
  ): Promise<TutorProfileView> {
    return this.relations.removeDistrict(user.id, districtId);
  }

  @Put('me/languages')
  @ApiOperation({ summary: 'Add a spoken language' })
  addLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddTutorLanguageDto,
  ): Promise<TutorProfileView> {
    return this.relations.addLanguage(user.id, dto.languageId);
  }

  @Delete('me/languages/:languageId')
  @ApiOperation({ summary: 'Remove a spoken language' })
  removeLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('languageId') languageId: string,
  ): Promise<TutorProfileView> {
    return this.relations.removeLanguage(user.id, languageId);
  }

  @Get('me/availability')
  @ApiOperation({ summary: 'Get the weekly availability windows' })
  getAvailability(@CurrentUser() user: AuthenticatedUser): Promise<AvailabilitySlotView[]> {
    return this.availability.getOwnAvailability(user.id);
  }

  @Put('me/availability')
  @ApiOperation({ summary: 'Replace the weekly availability windows' })
  setAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetAvailabilityDto,
  ): Promise<AvailabilitySlotView[]> {
    return this.availability.setOwnAvailability(user.id, dto);
  }

  @Get('me/certificates')
  @ApiOperation({ summary: 'List the tutor certificates' })
  listCertificates(@CurrentUser() user: AuthenticatedUser): Promise<CertificateView[]> {
    return this.relations.listCertificates(user.id);
  }

  @Post('me/certificates')
  @ApiOperation({ summary: 'Add a certificate (enters PENDING review)' })
  addCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCertificateDto,
  ): Promise<CertificateView> {
    return this.relations.addCertificate(user.id, dto);
  }

  @Delete('me/certificates/:certificateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a certificate' })
  async removeCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('certificateId') certificateId: string,
  ): Promise<void> {
    await this.relations.removeCertificate(user.id, certificateId);
  }
}

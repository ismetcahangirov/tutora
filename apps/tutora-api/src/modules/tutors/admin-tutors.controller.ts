import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import type { Paginated } from '@common/pagination/page';
import { ApiPaginatedResponse, ApiStandardErrorResponses } from '@common/swagger';
import { AdminTutorsService } from './admin-tutors.service';
import { AdminUpdateTutorDto } from './dto/admin-update-tutor.dto';
import { ListTutorsQueryDto } from './dto/list-tutors-query.dto';
import { ReviewCertificateDto } from './dto/review-certificate.dto';
import { SetVerificationDto } from './dto/set-verification.dto';
import {
  AdminTutorListItemDto,
  AdminTutorViewDto,
  CertificateViewDto,
} from './dto/tutor-response.dto';
import type { AdminTutorListItem, AdminTutorView, CertificateView } from './tutors.types';

/** Admin-only tutor management, verification and certificate review (#29). */
@ApiTags('admin: tutors')
@ApiBearerAuth('bearer')
@ApiStandardErrorResponses('unauthorized', 'forbidden')
@Controller({ path: 'admin/tutors', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTutorsController {
  constructor(private readonly adminTutors: AdminTutorsService) {}

  @Get()
  @ApiOperation({ summary: 'List tutor profiles (paginated, filterable)' })
  @ApiPaginatedResponse(AdminTutorListItemDto)
  @ApiStandardErrorResponses('badRequest')
  list(@Query() query: ListTutorsQueryDto): Promise<Paginated<AdminTutorListItem>> {
    return this.adminTutors.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tutor profile (any status)' })
  @ApiParam({ name: 'id', description: 'Tutor profile id.' })
  @ApiOkResponse({ description: 'The tutor profile.', type: AdminTutorViewDto })
  @ApiStandardErrorResponses('notFound')
  getById(@Param('id') id: string): Promise<AdminTutorView> {
    return this.adminTutors.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tutor profile' })
  @ApiParam({ name: 'id', description: 'Tutor profile id.' })
  @ApiOkResponse({ description: 'The updated tutor profile.', type: AdminTutorViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  update(@Param('id') id: string, @Body() dto: AdminUpdateTutorDto): Promise<AdminTutorView> {
    return this.adminTutors.update(id, dto);
  }

  @Patch(':id/verification')
  @ApiOperation({ summary: 'Set the verification decision for a tutor' })
  @ApiParam({ name: 'id', description: 'Tutor profile id.' })
  @ApiOkResponse({ description: 'The tutor profile after the decision.', type: AdminTutorViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  setVerification(
    @Param('id') id: string,
    @Body() dto: SetVerificationDto,
  ): Promise<AdminTutorView> {
    return this.adminTutors.setVerification(id, dto);
  }

  @Patch(':id/certificates/:certificateId')
  @ApiOperation({ summary: 'Approve or reject a tutor certificate' })
  @ApiParam({ name: 'id', description: 'Tutor profile id.' })
  @ApiParam({ name: 'certificateId', description: 'Certificate id.' })
  @ApiOkResponse({ description: 'The reviewed certificate.', type: CertificateViewDto })
  @ApiStandardErrorResponses('badRequest', 'notFound')
  reviewCertificate(
    @Param('id') id: string,
    @Param('certificateId') certificateId: string,
    @Body() dto: ReviewCertificateDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<CertificateView> {
    return this.adminTutors.reviewCertificate(id, certificateId, dto, admin.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tutor profile' })
  @ApiParam({ name: 'id', description: 'Tutor profile id.' })
  @ApiNoContentResponse({ description: 'The tutor profile was soft-deleted.' })
  @ApiStandardErrorResponses('notFound')
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminTutors.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted tutor profile' })
  @ApiParam({ name: 'id', description: 'Tutor profile id.' })
  @ApiOkResponse({ description: 'The restored tutor profile.', type: AdminTutorViewDto })
  @ApiStandardErrorResponses('notFound')
  restore(@Param('id') id: string): Promise<AdminTutorView> {
    return this.adminTutors.restore(id);
  }
}

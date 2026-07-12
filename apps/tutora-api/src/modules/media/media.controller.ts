import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@modules/auth/types/auth.types';
import { MediaService } from './media.service';
import type { UploadTicketView } from './media.types';
import { CreateUploadDto } from './dto/create-upload.dto';

/**
 * Signed media uploads (#37). Any authenticated user may request an upload
 * ticket; the object key is namespaced to them and the downstream endpoints
 * (avatar, certificate) enforce who may actually attach the resulting `fileUrl`.
 */
@ApiTags('media')
@ApiBearerAuth('bearer')
@Controller({ path: 'media', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('uploads')
  @ApiOperation({ summary: 'Create a signed upload ticket for an avatar or certificate' })
  createUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUploadDto,
  ): Promise<UploadTicketView> {
    return this.media.createUpload(user, dto);
  }
}

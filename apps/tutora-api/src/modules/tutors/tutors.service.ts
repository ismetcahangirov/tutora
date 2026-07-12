import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import {
  TUTOR_PROFILE_INCLUDE,
  type TutorProfileWithRelations,
  toPublicTutorView,
  toTutorProfileView,
} from './tutors.mapper';
import type { PublicTutorView, TutorProfileView } from './tutors.types';

/**
 * Tutor profile lifecycle (#29): the owning tutor's own profile plus the public
 * detail view. Relation collections (subjects, districts, languages,
 * certificates) live in `TutorRelationsService`, which reuses the helpers here.
 */
@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the caller's own profile, creating an empty shell on first access. */
  async getOwnProfile(userId: string): Promise<TutorProfileView> {
    return toTutorProfileView(await this.ensureProfile(userId));
  }

  /**
   * Applies a partial update to the caller's profile. Publishing is gated: a
   * profile can only go public once an admin has marked it VERIFIED, so an
   * unverified tutor cannot make themselves discoverable.
   */
  async updateOwnProfile(userId: string, dto: UpdateTutorProfileDto): Promise<TutorProfileView> {
    const profile = await this.ensureProfile(userId);

    if (dto.isPublished === true && profile.verificationStatus !== 'VERIFIED') {
      throw new ConflictException('Profile must be verified before it can be published');
    }

    const data: Prisma.TutorProfileUpdateInput = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
    if (dto.hourlyRate !== undefined) data.hourlyRate = dto.hourlyRate;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.formats !== undefined) data.formats = { set: dto.formats };
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;

    const updated = await this.prisma.tutorProfile.update({
      where: { userId },
      data,
      include: TUTOR_PROFILE_INCLUDE,
    });
    return toTutorProfileView(updated);
  }

  /**
   * Submits the profile for admin review. UNVERIFIED/REJECTED move to PENDING;
   * an already-PENDING submission is an idempotent no-op; a VERIFIED profile
   * cannot be resubmitted.
   */
  async submitForVerification(userId: string): Promise<TutorProfileView> {
    const profile = await this.ensureProfile(userId);

    if (profile.verificationStatus === 'VERIFIED') {
      throw new ConflictException('Profile is already verified');
    }
    if (profile.verificationStatus === 'PENDING') {
      return toTutorProfileView(profile);
    }

    const updated = await this.prisma.tutorProfile.update({
      where: { userId },
      data: { verificationStatus: 'PENDING' },
      include: TUTOR_PROFILE_INCLUDE,
    });
    return toTutorProfileView(updated);
  }

  /** Public detail for a single tutor. Only published, non-deleted profiles resolve. */
  async getPublicById(id: string): Promise<PublicTutorView> {
    const profile = await this.prisma.tutorProfile.findFirst({
      where: { id, isPublished: true, deletedAt: null },
      include: TUTOR_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException('Tutor not found');
    }
    return toPublicTutorView(profile);
  }

  /**
   * Get-or-create the caller's profile with all relations loaded. Shared by the
   * relations service so every mutation has a guaranteed profile to attach to.
   * Handles the create race (two concurrent first-writes) via the unique index.
   */
  async ensureProfile(userId: string): Promise<TutorProfileWithRelations> {
    const existing = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: TUTOR_PROFILE_INCLUDE,
    });
    if (existing) {
      return existing;
    }
    try {
      return await this.prisma.tutorProfile.create({
        data: { userId, hourlyRate: 0 },
        include: TUTOR_PROFILE_INCLUDE,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await this.prisma.tutorProfile.findUnique({
          where: { userId },
          include: TUTOR_PROFILE_INCLUDE,
        });
        if (raced) return raced;
      }
      throw error;
    }
  }

  /** Reloads and maps the caller's full profile — used after relation mutations. */
  async viewByUserId(userId: string): Promise<TutorProfileView> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: TUTOR_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }
    return toTutorProfileView(profile);
  }
}

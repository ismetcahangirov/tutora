import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { buildPage, type Paginated } from '@common/pagination/page';
import type { AdminUpdateTutorDto } from './dto/admin-update-tutor.dto';
import type { ListTutorsQueryDto } from './dto/list-tutors-query.dto';
import type { ReviewCertificateDto } from './dto/review-certificate.dto';
import type { SetVerificationDto } from './dto/set-verification.dto';
import { assertUniquePricingPeriods, resolveHourlyRateCache } from './pricing.util';
import {
  TUTOR_LIST_SELECT,
  TUTOR_PROFILE_INCLUDE,
  toAdminTutorListItem,
  toAdminTutorView,
  toCertificateView,
} from './tutors.mapper';
import type { AdminTutorListItem, AdminTutorView, CertificateView } from './tutors.types';

/** Administrative tutor management, verification and certificate review (#29). */
@Injectable()
export class AdminTutorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTutorsQueryDto): Promise<Paginated<AdminTutorListItem>> {
    const where: Prisma.TutorProfileWhereInput = {};
    if (!query.includeDeleted) {
      where.deletedAt = null;
    }
    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished;
    }
    if (query.q) {
      where.user = {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
        ],
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tutorProfile.findMany({
        where,
        select: TUTOR_LIST_SELECT,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tutorProfile.count({ where }),
    ]);

    return buildPage(rows.map(toAdminTutorListItem), total, query.page, query.limit);
  }

  async getById(id: string): Promise<AdminTutorView> {
    return toAdminTutorView(await this.findOrThrow(id));
  }

  /** Full admin edit. May set fields a tutor cannot, including verification. */
  async update(id: string, dto: AdminUpdateTutorDto): Promise<AdminTutorView> {
    await this.findOrThrow(id);

    const data: Prisma.TutorProfileUpdateInput = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
    if (dto.pricingTiers !== undefined) {
      assertUniquePricingPeriods(dto.pricingTiers);
      data.hourlyRateCache = resolveHourlyRateCache(dto.pricingTiers);
      data.pricingTiers = {
        deleteMany: { tutorSubjectId: null },
        create: dto.pricingTiers.map((t) => ({ period: t.period, amount: t.amount })),
      };
    }
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.formats !== undefined) data.formats = { set: dto.formats };
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.verificationStatus !== undefined) data.verificationStatus = dto.verificationStatus;

    const updated = await this.prisma.tutorProfile.update({
      where: { id },
      data,
      include: TUTOR_PROFILE_INCLUDE,
    });
    return toAdminTutorView(updated);
  }

  /**
   * Sets the verification decision. Any status other than VERIFIED also
   * unpublishes the profile, since an unverified tutor must not stay public.
   */
  async setVerification(id: string, dto: SetVerificationDto): Promise<AdminTutorView> {
    await this.findOrThrow(id);
    const isVerified = dto.status === 'VERIFIED';
    const updated = await this.prisma.tutorProfile.update({
      where: { id },
      data: {
        verificationStatus: dto.status,
        // A verified tutor carries no rejection reason; otherwise record it.
        verificationReason: isVerified ? null : (dto.reason ?? null),
        ...(isVerified ? {} : { isPublished: false }),
      },
      include: TUTOR_PROFILE_INCLUDE,
    });
    return toAdminTutorView(updated);
  }

  /** Soft-deletes a tutor profile and removes it from public listings. */
  async softDelete(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.tutorProfile.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  }

  async restore(id: string): Promise<AdminTutorView> {
    await this.findOrThrow(id);
    const updated = await this.prisma.tutorProfile.update({
      where: { id },
      data: { deletedAt: null },
      include: TUTOR_PROFILE_INCLUDE,
    });
    return toAdminTutorView(updated);
  }

  /** Records the review decision on a certificate, stamping the reviewing admin. */
  async reviewCertificate(
    tutorId: string,
    certificateId: string,
    dto: ReviewCertificateDto,
    adminId: string,
  ): Promise<CertificateView> {
    const cert = await this.prisma.certificate.findUnique({ where: { id: certificateId } });
    if (!cert || cert.tutorId !== tutorId) {
      throw new NotFoundException('Certificate not found');
    }
    const updated = await this.prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: dto.status,
        // An approved certificate carries no rejection reason; otherwise record it.
        reviewReason: dto.status === 'VERIFIED' ? null : (dto.reason ?? null),
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
    return toCertificateView(updated);
  }

  private async findOrThrow(id: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { id },
      include: TUTOR_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }
    return profile;
  }
}

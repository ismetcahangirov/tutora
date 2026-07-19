import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateCertificateDto } from './dto/create-certificate.dto';
import type { UpsertTutorSubjectDto } from './dto/upsert-tutor-subject.dto';
import { assertUniquePricingPeriods } from './pricing.util';
import { toCertificateView } from './tutors.mapper';
import { TutorsService } from './tutors.service';
import type { CertificateView, TutorProfileView } from './tutors.types';

/**
 * Manages the tutor's related collections (#29): subjects, service districts,
 * spoken languages and certificates. Each referenced taxonomy row is validated
 * first so the client gets a clean 404 rather than a raw foreign-key error.
 */
@Injectable()
export class TutorRelationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tutors: TutorsService,
  ) {}

  /** Idempotently attaches a subject (optionally with price-override tiers). */
  async upsertSubject(userId: string, dto: UpsertTutorSubjectDto): Promise<TutorProfileView> {
    const profile = await this.tutors.ensureProfile(userId);
    await this.assertExists('subject', dto.subjectId);
    const tiers = dto.pricingTiers ?? [];
    assertUniquePricingPeriods(tiers);

    await this.prisma.tutorSubject.upsert({
      where: { tutorId_subjectId: { tutorId: profile.id, subjectId: dto.subjectId } },
      create: {
        tutorId: profile.id,
        subjectId: dto.subjectId,
        pricingTiers: {
          create: tiers.map((t) => ({ tutorId: profile.id, period: t.period, amount: t.amount })),
        },
      },
      update: {
        pricingTiers: {
          deleteMany: {},
          create: tiers.map((t) => ({ tutorId: profile.id, period: t.period, amount: t.amount })),
        },
      },
    });
    return this.tutors.viewByUserId(userId);
  }

  async removeSubject(userId: string, subjectId: string): Promise<TutorProfileView> {
    const profile = await this.tutors.ensureProfile(userId);
    const link = await this.prisma.tutorSubject.findUnique({
      where: { tutorId_subjectId: { tutorId: profile.id, subjectId } },
    });
    if (!link) {
      throw new NotFoundException('Subject is not assigned to this tutor');
    }
    await this.prisma.tutorSubject.delete({
      where: { tutorId_subjectId: { tutorId: profile.id, subjectId } },
    });
    return this.tutors.viewByUserId(userId);
  }

  /** Idempotently attaches a service district. */
  async addDistrict(userId: string, districtId: string): Promise<TutorProfileView> {
    const profile = await this.tutors.ensureProfile(userId);
    await this.assertExists('district', districtId);

    await this.prisma.tutorDistrict.upsert({
      where: { tutorId_districtId: { tutorId: profile.id, districtId } },
      create: { tutorId: profile.id, districtId },
      update: {},
    });
    return this.tutors.viewByUserId(userId);
  }

  async removeDistrict(userId: string, districtId: string): Promise<TutorProfileView> {
    const profile = await this.tutors.ensureProfile(userId);
    const link = await this.prisma.tutorDistrict.findUnique({
      where: { tutorId_districtId: { tutorId: profile.id, districtId } },
    });
    if (!link) {
      throw new NotFoundException('District is not assigned to this tutor');
    }
    await this.prisma.tutorDistrict.delete({
      where: { tutorId_districtId: { tutorId: profile.id, districtId } },
    });
    return this.tutors.viewByUserId(userId);
  }

  /** Idempotently attaches a spoken language. */
  async addLanguage(userId: string, languageId: string): Promise<TutorProfileView> {
    const profile = await this.tutors.ensureProfile(userId);
    await this.assertExists('language', languageId);

    await this.prisma.tutorLanguage.upsert({
      where: { tutorId_languageId: { tutorId: profile.id, languageId } },
      create: { tutorId: profile.id, languageId },
      update: {},
    });
    return this.tutors.viewByUserId(userId);
  }

  async removeLanguage(userId: string, languageId: string): Promise<TutorProfileView> {
    const profile = await this.tutors.ensureProfile(userId);
    const link = await this.prisma.tutorLanguage.findUnique({
      where: { tutorId_languageId: { tutorId: profile.id, languageId } },
    });
    if (!link) {
      throw new NotFoundException('Language is not assigned to this tutor');
    }
    await this.prisma.tutorLanguage.delete({
      where: { tutorId_languageId: { tutorId: profile.id, languageId } },
    });
    return this.tutors.viewByUserId(userId);
  }

  /** Adds a certificate in PENDING state, awaiting admin review. */
  async addCertificate(userId: string, dto: CreateCertificateDto): Promise<CertificateView> {
    const profile = await this.tutors.ensureProfile(userId);
    const cert = await this.prisma.certificate.create({
      data: {
        tutorId: profile.id,
        title: dto.title,
        fileUrl: dto.fileUrl,
        issuedBy: dto.issuedBy,
      },
    });
    return toCertificateView(cert);
  }

  async listCertificates(userId: string): Promise<CertificateView[]> {
    const profile = await this.tutors.ensureProfile(userId);
    const certs = await this.prisma.certificate.findMany({
      where: { tutorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    return certs.map(toCertificateView);
  }

  async removeCertificate(userId: string, certificateId: string): Promise<void> {
    const profile = await this.tutors.ensureProfile(userId);
    const cert = await this.prisma.certificate.findUnique({ where: { id: certificateId } });
    // Ownership check folded into the 404 so one tutor can never probe another's certs.
    if (!cert || cert.tutorId !== profile.id) {
      throw new NotFoundException('Certificate not found');
    }
    await this.prisma.certificate.delete({ where: { id: certificateId } });
  }

  /** Confirms a referenced taxonomy row exists, else throws a clean 404. */
  private async assertExists(
    entity: 'subject' | 'district' | 'language',
    id: string,
  ): Promise<void> {
    const labels = { subject: 'Subject', district: 'District', language: 'Language' } as const;
    const found =
      entity === 'subject'
        ? await this.prisma.subject.findUnique({ where: { id }, select: { id: true } })
        : entity === 'district'
          ? await this.prisma.district.findUnique({ where: { id }, select: { id: true } })
          : await this.prisma.language.findUnique({ where: { id }, select: { id: true } });
    if (!found) {
      throw new NotFoundException(`${labels[entity]} not found`);
    }
  }
}

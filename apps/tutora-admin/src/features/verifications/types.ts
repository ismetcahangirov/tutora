/**
 * Verifications feature contracts (issue #63). Mirrors the API's admin tutor
 * projections. Zod validates the fields the UI consumes; unmodelled fields the
 * backend also returns (formats, counters…) are ignored at the boundary.
 */
import { z } from 'zod';

/** Tutor account-level verification state (mirrors Prisma `VerificationStatus`). */
export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Per-certificate review state (mirrors Prisma `CertificateStatus`). */
export const CERTIFICATE_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

/** The two decisions an admin can record when reviewing a certificate. */
export const CERTIFICATE_DECISIONS = ['VERIFIED', 'REJECTED'] as const;
export type CertificateDecision = (typeof CERTIFICATE_DECISIONS)[number];

export const certificateSchema = z.object({
  id: z.string(),
  title: z.string(),
  fileUrl: z.string(),
  status: z.enum(CERTIFICATE_STATUSES),
  issuedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type Certificate = z.infer<typeof certificateSchema>;

/** Only the display `name` is needed from each tutor relation. */
const namedSchema = z.object({ name: z.string() });

/** Full admin tutor projection used by the verification detail. */
export const adminTutorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  experienceYears: z.number(),
  hourlyRate: z.number(),
  currency: z.string(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  isPublished: z.boolean(),
  subjects: z.array(namedSchema),
  districts: z.array(namedSchema),
  languages: z.array(namedSchema),
  certificates: z.array(certificateSchema),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type AdminTutor = z.infer<typeof adminTutorSchema>;

/** Slim row for the verification queue table. */
export const adminTutorListItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  hourlyRate: z.number(),
  currency: z.string(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  isPublished: z.boolean(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type AdminTutorListItem = z.infer<typeof adminTutorListItemSchema>;

/** Query parameters for the tutor verification queue. */
export type ListTutorsParams = {
  page: number;
  limit: number;
  verificationStatus?: VerificationStatus;
  q?: string;
};

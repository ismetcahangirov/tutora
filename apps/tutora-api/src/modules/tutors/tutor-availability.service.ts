import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { AvailabilitySlotDto, SetAvailabilityDto } from './dto/set-availability.dto';
import { toAvailabilitySlotView } from './tutors.mapper';
import { TutorsService } from './tutors.service';
import type { AvailabilitySlotView } from './tutors.types';

/**
 * The tutor's recurring weekly availability (#55). A distinct responsibility from
 * the taxonomy joins in `TutorRelationsService`: slots are validated (start before
 * end, no same-weekday overlaps) and the whole week is replaced atomically so the
 * client's grid stays the single source of truth.
 */
@Injectable()
export class TutorAvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tutors: TutorsService,
  ) {}

  /** Returns the caller's availability, ordered by weekday then start time. */
  async getOwnAvailability(userId: string): Promise<AvailabilitySlotView[]> {
    const profile = await this.tutors.ensureProfile(userId);
    return this.listByTutorId(profile.id);
  }

  /**
   * Replaces the caller's entire weekly availability with `slots` (an empty array
   * clears it). Validates every window before touching the database, then swaps
   * the set in one transaction so a rejected request never leaves a partial week.
   */
  async setOwnAvailability(
    userId: string,
    dto: SetAvailabilityDto,
  ): Promise<AvailabilitySlotView[]> {
    const profile = await this.tutors.ensureProfile(userId);
    assertValidSlots(dto.slots);

    await this.prisma.$transaction([
      this.prisma.tutorAvailability.deleteMany({ where: { tutorId: profile.id } }),
      this.prisma.tutorAvailability.createMany({
        data: dto.slots.map((slot) => ({
          tutorId: profile.id,
          weekday: slot.weekday,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
        })),
      }),
    ]);

    return this.listByTutorId(profile.id);
  }

  private async listByTutorId(tutorId: string): Promise<AvailabilitySlotView[]> {
    const slots = await this.prisma.tutorAvailability.findMany({
      where: { tutorId },
      orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    });
    return slots.map(toAvailabilitySlotView);
  }
}

/**
 * Rejects windows that start at or after they end, and any pair of windows that
 * overlap on the same weekday. Adjacent windows that merely touch
 * (`prev.end === next.start`) are allowed. Throws `BadRequestException` on the
 * first problem so the client gets a clean, specific 400.
 */
export function assertValidSlots(slots: readonly AvailabilitySlotDto[]): void {
  for (const slot of slots) {
    if (slot.startMinute >= slot.endMinute) {
      throw new BadRequestException('Each availability window must start before it ends');
    }
  }

  const byWeekday = new Map<string, AvailabilitySlotDto[]>();
  for (const slot of slots) {
    const bucket = byWeekday.get(slot.weekday) ?? [];
    bucket.push(slot);
    byWeekday.set(slot.weekday, bucket);
  }

  for (const bucket of byWeekday.values()) {
    const ordered = [...bucket].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = ordered[i - 1];
      const curr = ordered[i];
      if (prev && curr && curr.startMinute < prev.endMinute) {
        throw new BadRequestException('Availability windows on the same day must not overlap');
      }
    }
  }
}

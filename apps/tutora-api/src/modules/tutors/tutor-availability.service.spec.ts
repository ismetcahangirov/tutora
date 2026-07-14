import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { TutorAvailabilityService } from './tutor-availability.service';
import { TutorsService } from './tutors.service';

function buildPrismaMock() {
  return {
    tutorAvailability: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

function buildTutorsMock() {
  return { ensureProfile: jest.fn().mockResolvedValue({ id: 'tp1' }) };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      TutorAvailabilityService,
      { provide: PrismaService, useValue: prisma },
      { provide: TutorsService, useValue: buildTutorsMock() },
    ],
  }).compile();
  return moduleRef.get(TutorAvailabilityService);
}

const MON_9_TO_11 = { weekday: 'MON' as const, startMinute: 540, endMinute: 660 };

describe('TutorAvailabilityService.getOwnAvailability', () => {
  it('returns the caller slots ordered by the query, mapped to the view shape', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorAvailability.findMany.mockResolvedValueOnce([
      {
        id: 'a1',
        tutorId: 'tp1',
        weekday: 'MON',
        startMinute: 540,
        endMinute: 660,
        createdAt: new Date(),
      },
    ]);

    const service = await buildService(prisma);
    const result = await service.getOwnAvailability('u1');

    expect(prisma.tutorAvailability.findMany).toHaveBeenCalledWith({
      where: { tutorId: 'tp1' },
      orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    });
    expect(result).toEqual([{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }]);
  });
});

describe('TutorAvailabilityService.setOwnAvailability', () => {
  it('replaces the week in one transaction: clears then bulk-inserts the new slots', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorAvailability.findMany.mockResolvedValueOnce([
      {
        id: 'a1',
        tutorId: 'tp1',
        weekday: 'MON',
        startMinute: 540,
        endMinute: 660,
        createdAt: new Date(),
      },
    ]);

    const service = await buildService(prisma);
    const result = await service.setOwnAvailability('u1', {
      slots: [MON_9_TO_11, { weekday: 'WED', startMinute: 600, endMinute: 720 }],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tutorAvailability.deleteMany).toHaveBeenCalledWith({ where: { tutorId: 'tp1' } });
    expect(prisma.tutorAvailability.createMany).toHaveBeenCalledWith({
      data: [
        { tutorId: 'tp1', weekday: 'MON', startMinute: 540, endMinute: 660 },
        { tutorId: 'tp1', weekday: 'WED', startMinute: 600, endMinute: 720 },
      ],
    });
    expect(result).toEqual([{ id: 'a1', weekday: 'MON', startMinute: 540, endMinute: 660 }]);
  });

  it('clears availability when given an empty list', async () => {
    const prisma = buildPrismaMock();

    const service = await buildService(prisma);
    await service.setOwnAvailability('u1', { slots: [] });

    expect(prisma.tutorAvailability.deleteMany).toHaveBeenCalledWith({ where: { tutorId: 'tp1' } });
    expect(prisma.tutorAvailability.createMany).toHaveBeenCalledWith({ data: [] });
  });

  it('rejects a window that ends at or before it starts, writing nothing', async () => {
    const prisma = buildPrismaMock();

    const service = await buildService(prisma);
    await expect(
      service.setOwnAvailability('u1', {
        slots: [{ weekday: 'MON', startMinute: 660, endMinute: 540 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects overlapping windows on the same weekday', async () => {
    const prisma = buildPrismaMock();

    const service = await buildService(prisma);
    await expect(
      service.setOwnAvailability('u1', {
        slots: [MON_9_TO_11, { weekday: 'MON', startMinute: 600, endMinute: 780 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.tutorAvailability.createMany).not.toHaveBeenCalled();
  });

  it('allows adjacent (touching) windows and overlaps across different weekdays', async () => {
    const prisma = buildPrismaMock();

    const service = await buildService(prisma);
    await service.setOwnAvailability('u1', {
      slots: [
        { weekday: 'MON', startMinute: 540, endMinute: 660 },
        { weekday: 'MON', startMinute: 660, endMinute: 780 },
        { weekday: 'TUE', startMinute: 540, endMinute: 660 },
      ],
    });

    expect(prisma.tutorAvailability.createMany).toHaveBeenCalledTimes(1);
  });
});

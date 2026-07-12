import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationsService } from './applications.service';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';

function makeApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app1',
    status: 'PENDING',
    message: null,
    format: null,
    subject: null,
    respondedAt: null,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
    student: { id: 'sp1', user: { name: 'Bob', avatarUrl: null } },
    tutor: { id: 'tp1', user: { name: 'Ada', avatarUrl: null } },
    ...overrides,
  };
}

function buildPrismaMock() {
  return {
    studentProfile: { findUnique: jest.fn(), create: jest.fn() },
    tutorProfile: { findUnique: jest.fn(), findFirst: jest.fn() },
    subject: { findUnique: jest.fn() },
    application: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

async function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const moduleRef = await Test.createTestingModule({
    providers: [ApplicationsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(ApplicationsService);
}

function listQuery(overrides: Partial<ListApplicationsQueryDto> = {}): ListApplicationsQueryDto {
  return Object.assign(new ListApplicationsQueryDto(), overrides);
}

describe('ApplicationsService.create', () => {
  it('creates a pending application to a published tutor', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce({ id: 'sp1' });
    prisma.tutorProfile.findFirst.mockResolvedValueOnce({ id: 'tp1' });
    prisma.application.findFirst.mockResolvedValueOnce(null); // no active dup
    prisma.application.create.mockResolvedValueOnce(makeApplication());

    const service = await buildService(prisma);
    const result = await service.create('u1', { tutorId: 'tp1', message: 'Hi' });

    expect(prisma.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { studentId: 'sp1', tutorId: 'tp1', subjectId: null, format: null, message: 'Hi' },
      }),
    );
    expect(result).toMatchObject({ id: 'app1', status: 'PENDING' });
  });

  it('rejects applying to a tutor that is not published', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce({ id: 'sp1' });
    prisma.tutorProfile.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.create('u1', { tutorId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('rejects a second active application to the same tutor', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce({ id: 'sp1' });
    prisma.tutorProfile.findFirst.mockResolvedValueOnce({ id: 'tp1' });
    prisma.application.findFirst.mockResolvedValueOnce({ id: 'existing' });

    const service = await buildService(prisma);
    await expect(service.create('u1', { tutorId: 'tp1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('creates the student profile lazily on first application', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce(null);
    prisma.studentProfile.create.mockResolvedValueOnce({ id: 'sp1' });
    prisma.tutorProfile.findFirst.mockResolvedValueOnce({ id: 'tp1' });
    prisma.application.findFirst.mockResolvedValueOnce(null);
    prisma.application.create.mockResolvedValueOnce(makeApplication());

    const service = await buildService(prisma);
    await service.create('u1', { tutorId: 'tp1' });

    expect(prisma.studentProfile.create).toHaveBeenCalledWith({
      data: { userId: 'u1' },
      select: { id: true },
    });
  });
});

describe('ApplicationsService student cancel', () => {
  it('cancels a pending application', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce({ id: 'sp1' });
    prisma.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'PENDING' });
    prisma.application.update.mockResolvedValueOnce(makeApplication({ status: 'CANCELLED' }));

    const service = await buildService(prisma);
    const result = await service.cancel('u1', 'app1');

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'app1' }, data: { status: 'CANCELLED' } }),
    );
    expect(result.status).toBe('CANCELLED');
  });

  it('refuses to cancel a completed application', async () => {
    const prisma = buildPrismaMock();
    prisma.studentProfile.findUnique.mockResolvedValueOnce({ id: 'sp1' });
    prisma.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'COMPLETED' });

    const service = await buildService(prisma);
    await expect(service.cancel('u1', 'app1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.application.update).not.toHaveBeenCalled();
  });
});

describe('ApplicationsService tutor transitions', () => {
  it('accepts a pending application and stamps respondedAt', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce({ id: 'tp1' });
    prisma.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'PENDING' });

    let updateArg:
      { where: { id: string }; data: { status: string; respondedAt?: Date } } | undefined;
    prisma.application.update.mockImplementationOnce((arg: unknown) => {
      updateArg = arg as typeof updateArg;
      return Promise.resolve(makeApplication({ status: 'ACCEPTED' }));
    });

    const service = await buildService(prisma);
    await service.accept('u1', 'app1');

    expect(updateArg?.where).toEqual({ id: 'app1' });
    expect(updateArg?.data.status).toBe('ACCEPTED');
    expect(updateArg?.data.respondedAt).toBeInstanceOf(Date);
  });

  it('completes only an accepted application', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce({ id: 'tp1' });
    prisma.application.findFirst.mockResolvedValueOnce({ id: 'app1', status: 'PENDING' });

    const service = await buildService(prisma);
    await expect(service.complete('u1', 'app1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not leak another tutor’s application', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce({ id: 'tp1' });
    prisma.application.findFirst.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    await expect(service.accept('u1', 'foreign')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an empty page for a tutor with no profile yet', async () => {
    const prisma = buildPrismaMock();
    prisma.tutorProfile.findUnique.mockResolvedValueOnce(null);

    const service = await buildService(prisma);
    const result = await service.listForTutor('u1', listQuery());

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(prisma.application.findMany).not.toHaveBeenCalled();
  });
});

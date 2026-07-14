/**
 * CertificatesSection (#54) — the mutation hook, toast, and file services are
 * mocked. We assert the empty hint, that each certificate renders with its status,
 * and that tapping remove delegates to the hook with the right id.
 */
import { useToast } from '@/components/ui';
import type { MyTutorProfile, TutorCertificate } from '@features/tutor-profile/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { useCertificates } from '@features/tutor-profile/hooks/useCertificates';

import { CertificatesSection } from '../CertificatesSection';

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  useToast: jest.fn(),
}));
jest.mock('@features/tutor-profile/hooks/useCertificates', () => ({ useCertificates: jest.fn() }));
// Keep the native file modules out of the render (the add sheet imports them).
jest.mock('@features/tutor-profile/services/certificate-files', () => ({
  pickCertificateFile: jest.fn(),
  validateCertificateFile: jest.fn(() => null),
}));

const mockedUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockedUseCertificates = useCertificates as jest.MockedFunction<typeof useCertificates>;

const certificate: TutorCertificate = {
  id: 'c-1',
  title: 'IELTS 8.0',
  fileUrl: 'https://storage.example/certificates/u-1/abc.pdf',
  status: 'PENDING',
  issuedBy: 'British Council',
  reviewedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const baseProfile: MyTutorProfile = {
  id: 'tp-1',
  userId: 'u-1',
  name: 'Aygün',
  avatarUrl: null,
  bio: null,
  experienceYears: 6,
  hourlyRate: 30,
  currency: 'AZN',
  formats: ['ONLINE'],
  verificationStatus: 'VERIFIED',
  ratingAvg: 4.8,
  ratingCount: 12,
  profileViews: 340,
  isPublished: true,
  subjects: [],
  districts: [],
  languages: [],
  certificates: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const deleteCertificate = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockedUseToast.mockReturnValue({ show: jest.fn(), hide: jest.fn() });
  mockedUseCertificates.mockReturnValue({
    createCertificate: jest.fn(),
    deleteCertificate,
    isCreating: false,
    deletingId: null,
  });
});

describe('CertificatesSection (#54)', () => {
  it('shows the empty hint when there are no certificates', async () => {
    await renderWithProviders(
      <CertificatesSection profile={{ ...baseProfile, certificates: [] }} />,
    );

    expect(
      screen.getByText(
        'Add certificates to build trust — each is reviewed before it shows on your profile.',
      ),
    ).toBeTruthy();
  });

  it('lists each certificate with its status and removes on tap', async () => {
    await renderWithProviders(
      <CertificatesSection profile={{ ...baseProfile, certificates: [certificate] }} />,
    );

    expect(screen.getByText('IELTS 8.0')).toBeTruthy();
    expect(screen.getByText('British Council')).toBeTruthy();
    expect(screen.getByText('Under review')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Remove IELTS 8.0'));
    expect(deleteCertificate).toHaveBeenCalledWith('c-1');
  });
});

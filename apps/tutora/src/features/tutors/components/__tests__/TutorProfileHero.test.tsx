/**
 * TutorProfileHero (#171/#174) — the display name is capped to one line and
 * allowed to shrink, so a long name (or a long localized "Verified" string)
 * reliably wraps the verification badge onto its own line instead of pushing
 * it off-screen.
 */
import { tutorProfile } from '@features/tutors/__tests__/fixtures';
import { renderWithProviders, screen } from '@/test-utils';

import { TutorProfileHero } from '../TutorProfileHero';

describe('TutorProfileHero (#174)', () => {
  it('caps the display name to one line so the verified badge can wrap', async () => {
    const longName = 'Doktor Elşən Məhərrəmov-Quliyev-Əliyev';
    await renderWithProviders(<TutorProfileHero tutor={{ ...tutorProfile, name: longName }} />);

    const name = screen.getByText(longName);
    expect(name.props.numberOfLines).toBe(1);
  });

  it('renders the verified badge next to the name for a verified tutor', async () => {
    await renderWithProviders(
      <TutorProfileHero tutor={{ ...tutorProfile, verificationStatus: 'VERIFIED' }} />,
    );

    expect(screen.getByText('Verified')).toBeOnTheScreen();
  });
});

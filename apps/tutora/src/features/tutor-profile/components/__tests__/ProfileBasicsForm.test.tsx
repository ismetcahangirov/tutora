/**
 * ProfileBasicsForm (#53, #56) — the form must only send the fields the tutor
 * actually changed, and must not save an untouched (or invalid) form. Rendered in
 * the app providers so tokens + i18n resolve.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import type { MyTutorProfile } from '@features/tutor-profile/types';

import { ProfileBasicsForm } from '../ProfileBasicsForm';

const profile: MyTutorProfile = {
  id: 'tp-1',
  userId: 'u-1',
  name: 'Aygün',
  avatarUrl: null,
  bio: 'Existing bio',
  experienceYears: 5,
  hourlyRate: 30,
  currency: 'AZN',
  formats: ['ONLINE'],
  verificationStatus: 'VERIFIED',
  ratingAvg: 4.5,
  ratingCount: 3,
  profileViews: 100,
  isPublished: true,
  subjects: [],
  districts: [],
  languages: [],
  certificates: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfileBasicsForm (#53)', () => {
  it('sends only the changed field on save', async () => {
    const onSave = jest.fn();
    await renderWithProviders(
      <ProfileBasicsForm profile={profile} isSaving={false} onSave={onSave} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Hourly rate'), '45');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ hourlyRate: 45 });
  });

  it('does not save an untouched form', async () => {
    const onSave = jest.fn();
    await renderWithProviders(
      <ProfileBasicsForm profile={profile} isSaving={false} onSave={onSave} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not save while an invalid rate is entered', async () => {
    const onSave = jest.fn();
    await renderWithProviders(
      <ProfileBasicsForm profile={profile} isSaving={false} onSave={onSave} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Hourly rate'), 'abc');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
  });
});

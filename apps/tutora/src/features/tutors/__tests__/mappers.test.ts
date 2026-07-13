/**
 * Tutor view-model mappers (#40) — summary/profile → card + favorite snapshot.
 */
import { toFavoriteTutor, toTutorCardData } from '../mappers';
import { tutorProfile, tutorSummary } from './fixtures';

describe('toTutorCardData (#40)', () => {
  it('reduces a summary to the card field set', () => {
    expect(toTutorCardData(tutorSummary)).toEqual({
      id: 'tutor-1',
      name: 'Aygün Məmmədova',
      avatarUrl: null,
      ratingAvg: 4.8,
      ratingCount: 42,
      hourlyRate: 30,
      currency: 'AZN',
      isVerified: true,
      subjectNames: ['Mathematics'],
      formats: ['ONLINE', 'AT_STUDENT_HOME'],
    });
  });

  it('marks a non-verified tutor as unverified', () => {
    const card = toTutorCardData({ ...tutorSummary, verificationStatus: 'PENDING' });
    expect(card.isVerified).toBe(false);
  });
});

describe('toFavoriteTutor (#45)', () => {
  it('builds an identical snapshot from a full profile', () => {
    const favorite = toFavoriteTutor(tutorProfile);
    expect(favorite.id).toBe('tutor-1');
    expect(favorite.isVerified).toBe(true);
    expect(favorite.subjectNames).toEqual(['Mathematics', 'Physics']);
    expect(favorite.formats).toEqual(['ONLINE', 'AT_STUDENT_HOME']);
  });
});

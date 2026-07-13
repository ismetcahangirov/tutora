/**
 * TutorCard (#42/#43/#45) — renders the tutor summary and wires both the card
 * press (→ profile) and the favorite toggle independently.
 */
import type { TutorCardData } from '@features/tutors/mappers';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { TutorCard } from '../TutorCard';

const card: TutorCardData = {
  id: 't1',
  name: 'Aygün Məmmədova',
  avatarUrl: null,
  ratingAvg: 4.8,
  ratingCount: 42,
  hourlyRate: 30,
  currency: 'AZN',
  isVerified: true,
  subjectNames: ['Mathematics'],
  formats: ['ONLINE'],
};

describe('TutorCard (#42/#43/#45)', () => {
  it('renders name, price, rating and subjects', async () => {
    await renderWithProviders(
      <TutorCard
        tutor={card}
        isFavorite={false}
        onToggleFavorite={jest.fn()}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Aygün Məmmədova')).toBeOnTheScreen();
    expect(screen.getByText('4.8')).toBeOnTheScreen();
    expect(screen.getByText('Mathematics')).toBeOnTheScreen();
    expect(screen.getByText(/30 ₼/)).toBeOnTheScreen();
  });

  it('navigates when the card body is pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <TutorCard tutor={card} isFavorite={false} onToggleFavorite={jest.fn()} onPress={onPress} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Aygün Məmmədova' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('toggles the favorite without navigating', async () => {
    const onPress = jest.fn();
    const onToggleFavorite = jest.fn();
    await renderWithProviders(
      <TutorCard
        tutor={card}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
        onPress={onPress}
      />,
    );

    // Not favorited yet → the heart is labelled "Save".
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});

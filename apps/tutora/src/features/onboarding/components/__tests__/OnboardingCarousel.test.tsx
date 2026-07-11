/**
 * OnboardingCarousel — renders the value-proposition slides (issue #23).
 */
import { renderWithProviders, screen } from '@/test-utils';
import type { OnboardingSlide } from '@features/onboarding/types';

import { OnboardingCarousel } from '../OnboardingCarousel';

const SLIDES: OnboardingSlide[] = [
  { key: 'one', title: 'First slide', description: 'First description' },
  { key: 'two', title: 'Second slide', description: 'Second description' },
];

describe('OnboardingCarousel (#23)', () => {
  it('renders every slide’s title and description', async () => {
    await renderWithProviders(<OnboardingCarousel slides={SLIDES} />);

    expect(screen.getByText('First slide')).toBeTruthy();
    expect(screen.getByText('First description')).toBeTruthy();
    expect(screen.getByText('Second slide')).toBeTruthy();
  });
});

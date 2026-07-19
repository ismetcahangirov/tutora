/**
 * SubjectPriceRow (#56, #178) — collapsed by default with a price summary (or a
 * "uses the base rate" placeholder), expands into a per-period pricing editor,
 * and reports the full replacement tier set through `onChangeTiers`.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import type { TutorProfileSubject } from '@features/tutor-profile/types';

import { SubjectPriceRow } from '../SubjectPriceRow';

const SUBJECT_NO_OVERRIDE: TutorProfileSubject = {
  subjectId: 's-1',
  name: 'Mathematics',
  slug: 'mathematics',
  pricingTiers: [],
};

const SUBJECT_WITH_OVERRIDE: TutorProfileSubject = {
  subjectId: 's-2',
  name: 'Physics',
  slug: 'physics',
  pricingTiers: [{ period: 'HOURLY', amount: 40 }],
};

describe('SubjectPriceRow (#56, #178)', () => {
  it('shows a "uses the base rate" summary with no override tiers', async () => {
    await renderWithProviders(
      <SubjectPriceRow
        subject={SUBJECT_NO_OVERRIDE}
        currency="AZN"
        onChangeTiers={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByText('Uses the base rate')).toBeTruthy();
  });

  it('summarizes the HOURLY override when one is set', async () => {
    await renderWithProviders(
      <SubjectPriceRow
        subject={SUBJECT_WITH_OVERRIDE}
        currency="AZN"
        onChangeTiers={jest.fn()}
        onRemove={jest.fn()}
      />,
    );

    expect(screen.getByText('40 ₼/hr')).toBeTruthy();
  });

  it('expands the tier editor on tap and reports a new tier on commit', async () => {
    const onChangeTiers = jest.fn();
    await renderWithProviders(
      <SubjectPriceRow
        subject={SUBJECT_NO_OVERRIDE}
        currency="AZN"
        onChangeTiers={onChangeTiers}
        onRemove={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Edit pricing for Mathematics' }));
    const hourlyField = screen.getByLabelText('Hourly');
    await fireEvent.changeText(hourlyField, '25');
    await fireEvent(hourlyField, 'blur');

    expect(onChangeTiers).toHaveBeenCalledWith([{ period: 'HOURLY', amount: 25 }]);
  });

  it('fires onRemove when the trash affordance is pressed', async () => {
    const onRemove = jest.fn();
    await renderWithProviders(
      <SubjectPriceRow
        subject={SUBJECT_NO_OVERRIDE}
        currency="AZN"
        onChangeTiers={jest.fn()}
        onRemove={onRemove}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Remove Mathematics' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

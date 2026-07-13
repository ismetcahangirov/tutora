/**
 * RatingInput (#48) — renders five star buttons and reports the tapped rating.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { RatingInput } from '../RatingInput';

describe('RatingInput (#48)', () => {
  it('reports the rating for the tapped star', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<RatingInput value={0} onChange={onChange} />);

    await fireEvent.press(screen.getByTestId('rating-star-4'));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks stars up to the current value as selected', async () => {
    await renderWithProviders(<RatingInput value={3} onChange={jest.fn()} />);

    expect(screen.getByTestId('rating-star-3').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId('rating-star-4').props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it('does not report changes while disabled', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<RatingInput value={2} onChange={onChange} disabled />);

    await fireEvent.press(screen.getByTestId('rating-star-5'));

    expect(onChange).not.toHaveBeenCalled();
  });
});

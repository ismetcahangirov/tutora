/**
 * ReviewComposer (#48) — rating is required, the comment is trimmed, and submit
 * relays the chosen values.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { ReviewComposer } from '../ReviewComposer';

describe('ReviewComposer (#48)', () => {
  it('does not submit until a rating is chosen', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(
      <ReviewComposer submitLabel="Submit review" isSubmitting={false} onSubmit={onSubmit} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the rating and trimmed comment', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(
      <ReviewComposer submitLabel="Submit review" isSubmitting={false} onSubmit={onSubmit} />,
    );

    await fireEvent.press(screen.getByTestId('rating-star-5'));
    await fireEvent.changeText(
      screen.getByPlaceholderText('Share what the session was like…'),
      '  Great tutor  ',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Submit review' }));

    expect(onSubmit).toHaveBeenCalledWith(5, 'Great tutor');
  });

  it('prefills the initial rating and comment for editing', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(
      <ReviewComposer
        submitLabel="Save changes"
        isSubmitting={false}
        initialRating={3}
        initialComment="Was good"
        onSubmit={onSubmit}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith(3, 'Was good');
  });
});

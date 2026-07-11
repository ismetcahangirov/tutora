/**
 * Card rendering + press behavior (issue #12).
 */
import { Card, Text } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

describe('Card (#12)', () => {
  it('renders its children', async () => {
    await renderWithProviders(
      <Card>
        <Text>Tutor profile</Text>
      </Card>,
    );
    expect(screen.getByText('Tutor profile')).toBeOnTheScreen();
  });

  it('becomes a button and fires onPress when tappable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Card onPress={onPress}>
        <Text>Open</Text>
      </Card>,
    );

    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

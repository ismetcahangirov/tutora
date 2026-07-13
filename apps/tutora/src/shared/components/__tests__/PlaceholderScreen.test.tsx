/**
 * PlaceholderScreen — the tab-shell placeholder surface (issue #41).
 */
import { Text } from '@/components/ui';
import { fireEvent, renderWithProviders, screen } from '@/test-utils';

import { PlaceholderScreen } from '../PlaceholderScreen';

describe('PlaceholderScreen (#41)', () => {
  it('renders its title and description', async () => {
    await renderWithProviders(
      <PlaceholderScreen title="Your home" description="Coming soon" icon="home" />,
    );

    expect(screen.getByText('Your home')).toBeOnTheScreen();
    expect(screen.getByText('Coming soon')).toBeOnTheScreen();
  });

  it('fires the action when its button is pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <PlaceholderScreen title="Your profile" action={{ label: 'Sign out', onPress }} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders footer content when provided', async () => {
    await renderWithProviders(
      <PlaceholderScreen title="Your profile" footer={<Text>Footer node</Text>} />,
    );

    expect(screen.getByText('Footer node')).toBeOnTheScreen();
  });
});

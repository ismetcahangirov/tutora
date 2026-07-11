/**
 * RoleSelectionScreen — role cards + submit UI (issue #23).
 *
 * `useRoleSelection` is mocked so we drive each UI state directly and assert the
 * screen wires selection, the disabled/enabled continue action, and the error.
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';
import { ONBOARDING_COPY, ROLE_OPTIONS } from '@features/onboarding/constants';
import { useRoleSelection } from '@features/onboarding/hooks/useRoleSelection';

import { RoleSelectionScreen } from '../RoleSelectionScreen';

jest.mock('@features/onboarding/hooks/useRoleSelection', () => ({
  useRoleSelection: jest.fn(),
}));

const mockedUseRoleSelection = useRoleSelection as jest.MockedFunction<typeof useRoleSelection>;

const baseState = {
  selectedRole: null,
  selectRole: jest.fn(),
  submit: jest.fn(),
  isSubmitting: false,
  error: null,
};

function mockState(overrides: Partial<ReturnType<typeof useRoleSelection>> = {}) {
  mockedUseRoleSelection.mockReturnValue({ ...baseState, ...overrides });
}

describe('RoleSelectionScreen (#23)', () => {
  it('renders both role options', async () => {
    mockState();
    await renderWithProviders(<RoleSelectionScreen />);

    for (const option of ROLE_OPTIONS) {
      expect(screen.getByText(option.title)).toBeTruthy();
    }
  });

  it('disables continue until a role is selected', async () => {
    mockState({ selectedRole: null });
    await renderWithProviders(<RoleSelectionScreen />);

    expect(screen.getByRole('button', { name: ONBOARDING_COPY.role.continue })).toBeDisabled();
  });

  it('selects a role when its card is pressed', async () => {
    const selectRole = jest.fn();
    mockState({ selectRole });
    await renderWithProviders(<RoleSelectionScreen />);

    const option = ROLE_OPTIONS[1];
    if (!option) {
      throw new Error('expected two role options');
    }

    await fireEvent.press(screen.getByRole('radio', { name: option.title }));

    expect(selectRole).toHaveBeenCalledWith(option.role);
  });

  it('submits when continue is pressed with a selection', async () => {
    const submit = jest.fn();
    mockState({ selectedRole: 'STUDENT', submit });
    await renderWithProviders(<RoleSelectionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: ONBOARDING_COPY.role.continue }));

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('shows the error message when saving fails', async () => {
    mockState({ selectedRole: 'STUDENT', error: ONBOARDING_COPY.role.error });
    await renderWithProviders(<RoleSelectionScreen />);

    expect(screen.getByText(ONBOARDING_COPY.role.error)).toBeTruthy();
  });
});

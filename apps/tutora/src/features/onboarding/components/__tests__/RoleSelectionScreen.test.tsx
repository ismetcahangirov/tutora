/**
 * RoleSelectionScreen — role cards + submit UI (issue #23).
 *
 * `useRoleSelection` is mocked so we drive each UI state directly and assert the
 * screen wires selection, the disabled/enabled continue action, and the error.
 * Copy is asserted against the English catalog (tests boot i18n in English).
 */
import { fireEvent, renderWithProviders, screen } from '@/test-utils';
import en from '@/shared/i18n/locales/en.json';
import { SELECTABLE_ONBOARDING_ROLES } from '@features/onboarding/constants';
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

    for (const role of SELECTABLE_ONBOARDING_ROLES) {
      expect(screen.getByText(en.onboarding.roles[role].title)).toBeTruthy();
    }
  });

  it('disables continue until a role is selected', async () => {
    mockState({ selectedRole: null });
    await renderWithProviders(<RoleSelectionScreen />);

    expect(screen.getByRole('button', { name: en.onboarding.role.continue })).toBeDisabled();
  });

  it('selects a role when its card is pressed', async () => {
    const selectRole = jest.fn();
    mockState({ selectRole });
    await renderWithProviders(<RoleSelectionScreen />);

    const role = SELECTABLE_ONBOARDING_ROLES[1];
    if (!role) {
      throw new Error('expected two role options');
    }

    await fireEvent.press(screen.getByRole('radio', { name: en.onboarding.roles[role].title }));

    expect(selectRole).toHaveBeenCalledWith(role);
  });

  it('submits when continue is pressed with a selection', async () => {
    const submit = jest.fn();
    mockState({ selectedRole: 'STUDENT', submit });
    await renderWithProviders(<RoleSelectionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: en.onboarding.role.continue }));

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('shows the error message when saving fails', async () => {
    mockState({ selectedRole: 'STUDENT', error: en.onboarding.role.error });
    await renderWithProviders(<RoleSelectionScreen />);

    expect(screen.getByText(en.onboarding.role.error)).toBeTruthy();
  });
});

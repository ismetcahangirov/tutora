import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { i18n } from '@shared/i18n';

import { RejectReasonDialog } from './RejectReasonDialog';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

function renderDialog(onConfirm: (reason: string) => void) {
  return render(
    <RejectReasonDialog
      open
      onOpenChange={() => {}}
      title="Reject this tutor?"
      placeholder="Explain why"
      confirmLabel="Reject tutor"
      onConfirm={onConfirm}
    />,
  );
}

describe('RejectReasonDialog (#63)', () => {
  it('blocks confirmation until a reason is entered', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    await user.click(screen.getByRole('button', { name: 'Reject tutor' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      i18n.t('verifications.reject.reasonRequired'),
    );
  });

  it('submits the trimmed reason', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderDialog(onConfirm);

    await user.type(screen.getByRole('textbox'), '  Blurry ID scan  ');
    await user.click(screen.getByRole('button', { name: 'Reject tutor' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('Blurry ID scan');
  });
});

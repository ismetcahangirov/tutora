import { useAppUpdates } from '../hooks/useAppUpdates';
import { UpdatePromptModal } from './UpdatePromptModal';

/**
 * Render-less-except-for-the-prompt bridge, mounted once at the app root
 * (mirrors NotificationsBridge). Owns no business logic beyond wiring the
 * hook's state into the modal.
 */
export function UpdatesBridge() {
  const { status, downloadProgress, apply, dismiss } = useAppUpdates();

  return (
    <UpdatePromptModal
      status={status}
      downloadProgress={downloadProgress}
      onApply={apply}
      onDismiss={dismiss}
    />
  );
}

/**
 * `/messages` — the student Messages tab (issue #41).
 *
 * Scaffolded placeholder; the chat surface (backend module #34) is wired into
 * the app in a later issue of the student epic (#40).
 */
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared';

export default function MessagesTab() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      icon="message-circle"
      title={t('student.messages.title')}
      description={t('student.messages.description')}
      testID="student-messages"
    />
  );
}

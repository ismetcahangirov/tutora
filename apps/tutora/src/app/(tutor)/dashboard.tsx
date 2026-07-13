/**
 * `/dashboard` — the tutor experience entry (issue #41).
 *
 * Scaffolded placeholder; the tutor surface (schedule, students, earnings) is
 * its own epic. Offers sign-out so a tutor is never stranded here. Guarded
 * upstream by the `(tutor)` layout.
 */
import { useTranslation } from 'react-i18next';

import { useAuth } from '@features/auth';
import { PlaceholderScreen } from '@/shared';

export default function TutorDashboard() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <PlaceholderScreen
      icon="inbox"
      title={t('tutor.dashboard.title')}
      description={t('tutor.dashboard.description')}
      action={{
        label: t('common.signOut'),
        onPress: () => void signOut(),
        variant: 'outline',
      }}
      testID="tutor-dashboard"
    />
  );
}

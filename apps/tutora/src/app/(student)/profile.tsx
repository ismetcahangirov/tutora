/**
 * `/profile` — the student Profile tab (issue #41).
 *
 * Scaffolded placeholder that already carries two real controls: the language
 * switcher (#82) and sign-out (#22). The full account surface lands in a later
 * issue of the student epic (#40).
 */
import { useTranslation } from 'react-i18next';

import { useAuth } from '@features/auth';
import { PlaceholderScreen } from '@/shared';
import { LanguageSwitcher } from '@/shared/i18n';

export default function ProfileTab() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <PlaceholderScreen
      icon="user"
      title={t('student.profile.title')}
      description={t('student.profile.description')}
      footer={<LanguageSwitcher />}
      action={{
        label: t('common.signOut'),
        onPress: () => void signOut(),
        variant: 'outline',
      }}
      testID="student-profile"
    />
  );
}

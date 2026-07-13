/**
 * `/home` — the student Home tab (issue #41).
 *
 * Scaffolded placeholder; the personalized home surface lands in a later issue
 * of the student epic (#40). Guarded upstream by the `(student)` layout.
 */
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared';

export default function HomeTab() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      icon="home"
      title={t('student.home.title')}
      description={t('student.home.description')}
      testID="student-home"
    />
  );
}

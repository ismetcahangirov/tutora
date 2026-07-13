/**
 * `/search` — the student Search tab (issue #41).
 *
 * Scaffolded placeholder; tutor search + filtering ships in a later issue of the
 * student epic (#40).
 */
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared';

export default function SearchTab() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      icon="search"
      title={t('student.search.title')}
      description={t('student.search.description')}
      testID="student-search"
    />
  );
}

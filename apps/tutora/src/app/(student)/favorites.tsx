/**
 * `/favorites` — the student Favorites tab (issue #41).
 *
 * Scaffolded placeholder; saved tutors land in a later issue of the student
 * epic (#40).
 */
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared';

export default function FavoritesTab() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      icon="heart"
      title={t('student.favorites.title')}
      description={t('student.favorites.description')}
      testID="student-favorites"
    />
  );
}

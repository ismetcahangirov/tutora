/**
 * useTutorFilterSections — builds the search filter-sheet config (epic #40, #43).
 *
 * Assembles the chip sections the `FilterSheet` renders: subjects, districts, and
 * languages come from the taxonomy queries (they populate as those load), while
 * format, price band, minimum rating, and sort are fixed, localized option sets.
 * Keeping this out of the screen keeps the screen focused on state + results.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { FilterSection } from '@/components/ui';
import { useDistricts, useLanguages, useSubjects } from '@features/taxonomy';

import { LESSON_FORMATS, TUTOR_SORTS } from '../constants';
import { formatLabel } from '../format-labels';
import { FILTER_KEYS, PRICE_RANGES, RATING_THRESHOLDS } from '../search-filters';

/** Maps a price-range chip value to its label i18n key. */
const PRICE_LABEL_KEYS: Record<string, string> = {
  '0-20': 'tutors.filters.priceRanges.upTo20',
  '20-40': 'tutors.filters.priceRanges.from20to40',
  '40-60': 'tutors.filters.priceRanges.from40to60',
  '60-': 'tutors.filters.priceRanges.over60',
};

export function useTutorFilterSections(): FilterSection[] {
  const { t } = useTranslation();
  const { data: subjects = [] } = useSubjects();
  const { data: districts = [] } = useDistricts();
  const { data: languages = [] } = useLanguages();

  return useMemo<FilterSection[]>(
    () => [
      {
        key: FILTER_KEYS.subject,
        title: t('tutors.filters.subject'),
        options: subjects.map((subject) => ({ label: subject.name, value: subject.id })),
      },
      {
        key: FILTER_KEYS.district,
        title: t('tutors.filters.district'),
        options: districts.map((district) => ({ label: district.name, value: district.id })),
      },
      {
        key: FILTER_KEYS.language,
        title: t('tutors.filters.language'),
        options: languages.map((language) => ({ label: language.name, value: language.id })),
      },
      {
        key: FILTER_KEYS.format,
        title: t('tutors.filters.format'),
        options: LESSON_FORMATS.map((format) => ({
          label: formatLabel(t, format),
          value: format,
        })),
      },
      {
        key: FILTER_KEYS.price,
        title: t('tutors.filters.price'),
        options: PRICE_RANGES.map(({ value }) => ({
          label: t(PRICE_LABEL_KEYS[value] ?? value),
          value,
        })),
      },
      {
        key: FILTER_KEYS.rating,
        title: t('tutors.filters.rating'),
        options: RATING_THRESHOLDS.map((rating) => ({
          label: t('tutors.filters.ratingThreshold', { rating }),
          value: rating,
        })),
      },
      {
        key: FILTER_KEYS.sort,
        title: t('tutors.filters.sort'),
        options: TUTOR_SORTS.map((sort) => ({ label: t(`tutors.sort.${sort}`), value: sort })),
      },
    ],
    [t, subjects, districts, languages],
  );
}

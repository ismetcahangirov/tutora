/**
 * ProfileCollectionsSection — subjects (+pricing), districts and languages
 * (tutor epic #51, #53, #56).
 *
 * Groups the three taxonomy collections a tutor manages, each backed by its own
 * reference list and add-picker. Every add/remove/price change hits its endpoint
 * immediately (the backend returns the refreshed profile, so there is no separate
 * "save"); a failed call surfaces a toast and leaves the profile untouched.
 * Extracted from the screen so the screen stays a thin composition.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Text, useToast } from '@/components/ui';
import { useCities, useDistricts, useLanguages, useSubjects } from '@features/taxonomy';
import { spacing } from '@/theme';

import { useTutorProfileCollections } from '../hooks/useTutorProfileCollections';
import type { MyTutorProfile } from '../types';
import { SubjectPriceRow } from './SubjectPriceRow';
import { TaxonomyLinksField } from './TaxonomyLinksField';
import { TaxonomyPickerSheet } from './TaxonomyPickerSheet';

export type ProfileCollectionsSectionProps = {
  profile: MyTutorProfile;
};

/**
 * Adding a district is a two-step flow: pick a city, then pick from that
 * city's districts (#177). `district-city` is the first step; `district` is
 * the second, gated by `districtCityId`.
 */
type OpenPicker = 'subject' | 'district-city' | 'district' | 'language' | null;

export function ProfileCollectionsSection({ profile }: ProfileCollectionsSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [districtCityId, setDistrictCityId] = useState<string | null>(null);

  const { data: subjects = [] } = useSubjects();
  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useDistricts(districtCityId ?? undefined);
  const { data: languages = [] } = useLanguages();

  const collections = useTutorProfileCollections();

  /** Run a profile mutation, toasting on failure so a dropped edit is never silent. */
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch {
      toast.show({ message: t('tutor.profile.error'), type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <Card padding="lg" style={styles.card}>
        <Text variant="subtitle">{t('tutor.profile.subjects.title')}</Text>
        {profile.subjects.length === 0 ? (
          <Text variant="bodySmall" color="textSecondary">
            {t('tutor.profile.subjects.empty')}
          </Text>
        ) : (
          profile.subjects.map((subject) => (
            <SubjectPriceRow
              key={subject.subjectId}
              subject={subject}
              currency={profile.currency}
              disabled={collections.isSubjectMutating}
              onChangeTiers={(pricingTiers) =>
                void run(() =>
                  collections.upsertSubject({ subjectId: subject.subjectId, pricingTiers }),
                )
              }
              onRemove={() => void run(() => collections.removeSubject(subject.subjectId))}
            />
          ))
        )}
        <Button
          label={t('tutor.profile.subjects.add')}
          variant="outline"
          size="compact"
          leadingIcon="search"
          onPress={() => setOpenPicker('subject')}
          disabled={collections.isSubjectMutating}
          style={styles.addButton}
        />
      </Card>

      <Card padding="lg" style={styles.card}>
        <TaxonomyLinksField
          title={t('tutor.profile.districts.title')}
          items={profile.districts.map((d) => ({ id: d.districtId, name: d.name }))}
          addLabel={t('tutor.profile.districts.add')}
          emptyLabel={t('tutor.profile.districts.empty')}
          removeLabel={(name) => t('tutor.profile.districts.remove', { district: name })}
          disabled={collections.isDistrictMutating}
          onAdd={() => setOpenPicker('district-city')}
          onRemove={(id) => void run(() => collections.removeDistrict(id))}
        />
      </Card>

      <Card padding="lg" style={styles.card}>
        <TaxonomyLinksField
          title={t('tutor.profile.languages.title')}
          items={profile.languages.map((l) => ({ id: l.languageId, name: l.name }))}
          addLabel={t('tutor.profile.languages.add')}
          emptyLabel={t('tutor.profile.languages.empty')}
          removeLabel={(name) => t('tutor.profile.languages.remove', { language: name })}
          disabled={collections.isLanguageMutating}
          onAdd={() => setOpenPicker('language')}
          onRemove={(id) => void run(() => collections.removeLanguage(id))}
        />
      </Card>

      <TaxonomyPickerSheet
        visible={openPicker === 'subject'}
        title={t('tutor.profile.subjects.pickerTitle')}
        options={subjects.map((s) => ({ id: s.id, name: s.name }))}
        selectedIds={profile.subjects.map((s) => s.subjectId)}
        searchPlaceholder={t('tutor.profile.subjects.search')}
        emptyLabel={t('tutor.profile.subjects.pickerEmpty')}
        isMutating={collections.isSubjectMutating}
        onSelect={(id) => void run(() => collections.upsertSubject({ subjectId: id }))}
        onClose={() => setOpenPicker(null)}
      />
      <TaxonomyPickerSheet
        visible={openPicker === 'district-city'}
        title={t('tutor.profile.districts.cityPickerTitle')}
        options={cities.map((c) => ({ id: c.id, name: c.name }))}
        selectedIds={[]}
        searchPlaceholder={t('tutor.profile.districts.citySearch')}
        emptyLabel={t('tutor.profile.districts.cityPickerEmpty')}
        onSelect={(id) => {
          setDistrictCityId(id);
          setOpenPicker('district');
        }}
        onClose={() => setOpenPicker(null)}
      />
      <TaxonomyPickerSheet
        visible={openPicker === 'district'}
        title={t('tutor.profile.districts.pickerTitle')}
        options={districts.map((d) => ({ id: d.id, name: d.name }))}
        selectedIds={profile.districts.map((d) => d.districtId)}
        searchPlaceholder={t('tutor.profile.districts.search')}
        emptyLabel={t('tutor.profile.districts.pickerEmpty')}
        isMutating={collections.isDistrictMutating}
        onSelect={(id) => void run(() => collections.addDistrict(id))}
        onClose={() => {
          setOpenPicker(null);
          setDistrictCityId(null);
        }}
      />
      <TaxonomyPickerSheet
        visible={openPicker === 'language'}
        title={t('tutor.profile.languages.pickerTitle')}
        options={languages.map((l) => ({ id: l.id, name: l.name }))}
        selectedIds={profile.languages.map((l) => l.languageId)}
        searchPlaceholder={t('tutor.profile.languages.search')}
        emptyLabel={t('tutor.profile.languages.pickerEmpty')}
        isMutating={collections.isLanguageMutating}
        onSelect={(id) => void run(() => collections.addLanguage(id))}
        onClose={() => setOpenPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
});

/**
 * ProfileBasicsForm — the scalar profile fields + formats (tutor epic #51, #53, #56).
 *
 * Owns local, controlled state seeded from the profile: bio, years of experience,
 * base hourly rate + currency, and the lesson formats. Validates against the same
 * bounds the backend enforces and only sends the *changed* fields on save, so an
 * untouched field is never overwritten. Save is disabled until the form is both
 * dirty and valid; the parent owns the request (and its in-flight state).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Input, Text } from '@/components/ui';
import type { LessonFormat } from '@features/tutors';
import { spacing } from '@/theme';

import {
  BIO_MAX_LENGTH,
  DEFAULT_CURRENCY,
  EXPERIENCE_MAX_YEARS,
  EXPERIENCE_MIN_YEARS,
  HOURLY_RATE_MAX,
  HOURLY_RATE_MIN,
} from '../constants';
import type { MyTutorProfile, UpdateTutorProfileInput } from '../types';
import { FormatSelector } from './FormatSelector';

export type ProfileBasicsFormProps = {
  profile: MyTutorProfile;
  isSaving: boolean;
  onSave: (input: UpdateTutorProfileInput) => void;
};

/** Two format lists are equal when they hold the same members, order-independent. */
function sameFormats(a: LessonFormat[], b: LessonFormat[]): boolean {
  return a.length === b.length && a.every((format) => b.includes(format));
}

export function ProfileBasicsForm({ profile, isSaving, onSave }: ProfileBasicsFormProps) {
  const { t } = useTranslation();

  const [bio, setBio] = useState(profile.bio ?? '');
  const [experience, setExperience] = useState(String(profile.experienceYears));
  const [rate, setRate] = useState(String(profile.hourlyRate));
  const [currency, setCurrency] = useState(profile.currency || DEFAULT_CURRENCY);
  const [formats, setFormats] = useState<LessonFormat[]>(profile.formats);

  const experienceNum = Number(experience);
  const rateNum = Number(rate);

  const experienceError =
    !Number.isInteger(experienceNum) ||
    experienceNum < EXPERIENCE_MIN_YEARS ||
    experienceNum > EXPERIENCE_MAX_YEARS
      ? t('tutor.profile.basics.experienceError', { max: EXPERIENCE_MAX_YEARS })
      : undefined;

  const rateError =
    Number.isNaN(rateNum) || rateNum < HOURLY_RATE_MIN || rateNum > HOURLY_RATE_MAX
      ? t('tutor.profile.basics.rateError', { max: HOURLY_RATE_MAX })
      : undefined;

  const isValid = !experienceError && !rateError && currency.trim().length === 3;

  const isDirty =
    bio.trim() !== (profile.bio ?? '') ||
    experienceNum !== profile.experienceYears ||
    rateNum !== profile.hourlyRate ||
    currency.trim().toUpperCase() !== profile.currency ||
    !sameFormats(formats, profile.formats);

  const patch = useMemo<UpdateTutorProfileInput>(() => {
    const next: UpdateTutorProfileInput = {};
    if (bio.trim() !== (profile.bio ?? '')) {
      next.bio = bio.trim();
    }
    if (experienceNum !== profile.experienceYears) {
      next.experienceYears = experienceNum;
    }
    if (rateNum !== profile.hourlyRate) {
      next.hourlyRate = rateNum;
    }
    if (currency.trim().toUpperCase() !== profile.currency) {
      next.currency = currency.trim().toUpperCase();
    }
    if (!sameFormats(formats, profile.formats)) {
      next.formats = formats;
    }
    return next;
  }, [bio, experienceNum, rateNum, currency, formats, profile]);

  const handleSave = () => {
    if (!isValid || !isDirty || isSaving) {
      return;
    }
    onSave(patch);
  };

  return (
    <View style={styles.form}>
      <Input
        label={t('tutor.profile.basics.bioLabel')}
        placeholder={t('tutor.profile.basics.bioPlaceholder')}
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={BIO_MAX_LENGTH}
        disabled={isSaving}
        helperText={t('tutor.profile.basics.bioHelper', {
          count: bio.length,
          max: BIO_MAX_LENGTH,
        })}
      />

      <Input
        label={t('tutor.profile.basics.experienceLabel')}
        value={experience}
        onChangeText={setExperience}
        keyboardType="number-pad"
        maxLength={2}
        disabled={isSaving}
        errorText={experienceError}
      />

      <View style={styles.priceRow}>
        <Input
          containerStyle={styles.priceField}
          label={t('tutor.profile.basics.rateLabel')}
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          disabled={isSaving}
          errorText={rateError}
        />
        <Input
          containerStyle={styles.currencyField}
          label={t('tutor.profile.basics.currencyLabel')}
          value={currency}
          onChangeText={(text) => setCurrency(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
          disabled={isSaving}
        />
      </View>

      <View style={styles.field}>
        <Text variant="label">{t('tutor.profile.basics.formatsLabel')}</Text>
        <FormatSelector value={formats} onChange={setFormats} disabled={isSaving} />
      </View>

      <Button
        label={t('common.save')}
        onPress={handleSave}
        disabled={!isValid || !isDirty}
        loading={isSaving}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceField: {
    flex: 1,
  },
  currencyField: {
    width: 96,
  },
});

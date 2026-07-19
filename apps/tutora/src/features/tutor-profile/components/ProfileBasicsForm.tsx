/**
 * ProfileBasicsForm — the scalar profile fields + formats (tutor epic #51, #53,
 * #56; QA follow-up #178).
 *
 * Owns local, controlled state seeded from the profile: bio, years of
 * experience, base pricing tiers + currency, and the lesson formats. Validates
 * against the same bounds the backend enforces and only sends the *changed*
 * fields on save, so an untouched field is never overwritten. Save is disabled
 * until the form is both dirty and valid; the parent owns the request (and its
 * in-flight state).
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
} from '../constants';
import type { MyTutorProfile, PricingTier, UpdateTutorProfileInput } from '../types';
import { FormatSelector } from './FormatSelector';
import { PricingTierEditor } from './PricingTierEditor';

export type ProfileBasicsFormProps = {
  profile: MyTutorProfile;
  isSaving: boolean;
  onSave: (input: UpdateTutorProfileInput) => void;
};

/** Two format lists are equal when they hold the same members, order-independent. */
function sameFormats(a: LessonFormat[], b: LessonFormat[]): boolean {
  return a.length === b.length && a.every((format) => b.includes(format));
}

/** Two tier sets are equal when they hold the same (period, amount) pairs. */
function sameTiers(a: PricingTier[], b: PricingTier[]): boolean {
  return (
    a.length === b.length &&
    a.every((tier) =>
      b.some((other) => other.period === tier.period && other.amount === tier.amount),
    )
  );
}

export function ProfileBasicsForm({ profile, isSaving, onSave }: ProfileBasicsFormProps) {
  const { t } = useTranslation();

  const [bio, setBio] = useState(profile.bio ?? '');
  const [experience, setExperience] = useState(String(profile.experienceYears));
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(profile.pricingTiers);
  const [currency, setCurrency] = useState(profile.currency || DEFAULT_CURRENCY);
  const [formats, setFormats] = useState<LessonFormat[]>(profile.formats);

  const experienceNum = Number(experience);

  const experienceError =
    !Number.isInteger(experienceNum) ||
    experienceNum < EXPERIENCE_MIN_YEARS ||
    experienceNum > EXPERIENCE_MAX_YEARS
      ? t('tutor.profile.basics.experienceError', { max: EXPERIENCE_MAX_YEARS })
      : undefined;

  const isValid = !experienceError && currency.trim().length === 3;

  const isDirty =
    bio.trim() !== (profile.bio ?? '') ||
    experienceNum !== profile.experienceYears ||
    !sameTiers(pricingTiers, profile.pricingTiers) ||
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
    if (!sameTiers(pricingTiers, profile.pricingTiers)) {
      next.pricingTiers = pricingTiers;
    }
    if (currency.trim().toUpperCase() !== profile.currency) {
      next.currency = currency.trim().toUpperCase();
    }
    if (!sameFormats(formats, profile.formats)) {
      next.formats = formats;
    }
    return next;
  }, [bio, experienceNum, pricingTiers, currency, formats, profile]);

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

      <Input
        label={t('tutor.profile.basics.currencyLabel')}
        value={currency}
        onChangeText={(text) => setCurrency(text.toUpperCase())}
        autoCapitalize="characters"
        maxLength={3}
        disabled={isSaving}
      />

      <View style={styles.field}>
        <Text variant="label">{t('tutor.profile.basics.pricingTitle')}</Text>
        <PricingTierEditor
          tiers={pricingTiers}
          currency={currency}
          disabled={isSaving}
          onChange={setPricingTiers}
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
});

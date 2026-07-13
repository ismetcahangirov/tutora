/**
 * TutorDetailScreen — the full tutor profile (student epic #40, #44).
 *
 * Fetches one tutor by id and renders certificates, experience, subjects (with
 * per-subject prices), districts, languages, formats, and a reviews preview, plus
 * a favorite toggle in the header and a contact CTA pinned to the bottom. Handles
 * the four states explicitly: loading skeleton, "not found" (a 404 →
 * `TutorNotFoundError`), a generic error with retry, and success.
 *
 * The contact action is a placeholder toast until the chat surface (#47) and
 * applications land; it is wired here so the CTA is real, not dead.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FavoriteButton, useFavorites } from '@features/favorites';
import { ReviewsPreview } from '@features/reviews';
import { Button, EmptyState, ErrorState, LoadingState, Text, useToast } from '@/components/ui';
import { formatPrice } from '@/shared';
import { spacing, useColors } from '@/theme';

import { TutorNotFoundError } from '../api/tutors.api';
import { CertificateItem } from '../components/CertificateItem';
import { InfoTag } from '../components/InfoTag';
import { ProfileSection, TagRow } from '../components/ProfileSection';
import { TutorProfileHero } from '../components/TutorProfileHero';
import { formatLabel } from '../format-labels';
import { useTutorDetail } from '../hooks/useTutorDetail';
import { toFavoriteTutor } from '../mappers';

export type TutorDetailScreenProps = {
  id: string;
  onBack: () => void;
};

export function TutorDetailScreen({ id, onBack }: TutorDetailScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { isFavorite, toggle } = useFavorites();
  const { data: tutor, isLoading, isError, error, refetch } = useTutorDetail(id);

  const header = (
    <TutorDetailHeader
      onBack={onBack}
      favorite={
        tutor ? (
          <FavoriteButton
            active={isFavorite(tutor.id)}
            onPress={() => toggle(toFavoriteTutor(tutor))}
            accessibilityLabel={isFavorite(tutor.id) ? t('favorites.remove') : t('favorites.add')}
          />
        ) : null
      }
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
        {header}
        <LoadingState label={t('common.loading')} />
      </SafeAreaView>
    );
  }

  if (isError || !tutor) {
    const notFound = error instanceof TutorNotFoundError;
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
        {header}
        {notFound ? (
          <EmptyState
            icon="user"
            title={t('tutors.detail.notFoundTitle')}
            description={t('tutors.detail.notFoundDescription')}
          />
        ) : (
          <ErrorState
            title={t('tutors.detail.errorTitle')}
            retryLabel={t('common.retry')}
            onRetry={() => void refetch()}
          />
        )}
      </SafeAreaView>
    );
  }

  const handleContact = () => {
    toast.show({ message: t('tutors.detail.contactSoon'), type: 'info' });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {header}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TutorProfileHero tutor={tutor} />

        {tutor.bio ? (
          <ProfileSection title={t('tutors.detail.about')}>
            <Text variant="body" color="textSecondary">
              {tutor.bio}
            </Text>
          </ProfileSection>
        ) : null}

        {tutor.subjects.length > 0 ? (
          <ProfileSection title={t('tutors.detail.subjects')}>
            <TagRow>
              {tutor.subjects.map((subject) => (
                <InfoTag
                  key={subject.subjectId}
                  icon="book-open"
                  label={subject.name}
                  note={
                    subject.priceOverride !== null
                      ? formatPrice(subject.priceOverride, tutor.currency)
                      : undefined
                  }
                />
              ))}
            </TagRow>
          </ProfileSection>
        ) : null}

        {tutor.districts.length > 0 ? (
          <ProfileSection title={t('tutors.detail.districts')}>
            <TagRow>
              {tutor.districts.map((district) => (
                <InfoTag key={district.districtId} icon="map-pin" label={district.name} />
              ))}
            </TagRow>
          </ProfileSection>
        ) : null}

        {tutor.languages.length > 0 ? (
          <ProfileSection title={t('tutors.detail.languages')}>
            <TagRow>
              {tutor.languages.map((language) => (
                <InfoTag key={language.languageId} icon="globe" label={language.name} />
              ))}
            </TagRow>
          </ProfileSection>
        ) : null}

        {tutor.formats.length > 0 ? (
          <ProfileSection title={t('tutors.detail.formats')}>
            <TagRow>
              {tutor.formats.map((format) => (
                <InfoTag key={format} label={formatLabel(t, format)} />
              ))}
            </TagRow>
          </ProfileSection>
        ) : null}

        {tutor.certificates.length > 0 ? (
          <ProfileSection title={t('tutors.detail.certificates')}>
            <View style={styles.certificates}>
              {tutor.certificates.map((certificate) => (
                <CertificateItem key={certificate.id} certificate={certificate} />
              ))}
            </View>
          </ProfileSection>
        ) : null}

        <ProfileSection title={t('tutors.detail.reviews')} count={tutor.ratingCount}>
          <ReviewsPreview tutorId={tutor.id} />
        </ProfileSection>
      </ScrollView>

      <View
        style={[styles.cta, { backgroundColor: colors.background, borderColor: colors.border }]}
      >
        <Button
          label={t('tutors.detail.contact')}
          leadingIcon="message-circle"
          onPress={handleContact}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

/** Sticky top bar: back button on the left, favorite toggle on the right. */
function TutorDetailHeader({
  onBack,
  favorite,
}: {
  onBack: () => void;
  favorite: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerBar}>
      <Button
        label={t('common.back')}
        accessibilityLabel={t('common.back')}
        variant="ghost"
        size="compact"
        leadingIcon="arrow-left"
        onPress={onBack}
        style={styles.backButton}
      />
      {favorite}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing['2xl'],
  },
  certificates: {
    gap: spacing.lg,
  },
  cta: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});

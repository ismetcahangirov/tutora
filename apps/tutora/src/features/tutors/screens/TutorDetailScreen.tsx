/**
 * TutorDetailScreen — the full tutor profile (student epic #40, #44).
 *
 * Fetches one tutor by id and renders certificates, experience, subjects (with
 * per-subject prices), districts, languages, formats, and a reviews preview, plus
 * a favorite toggle in the header and a contact CTA pinned to the bottom. Handles
 * the four states explicitly: loading skeleton, "not found" (a 404 →
 * `TutorNotFoundError`), a generic error with retry, and success.
 *
 * The contact CTA opens (or fetches) the real chat thread with this tutor and
 * hands it to `onContact` for navigation; a caller with no active application
 * gets a `NoActiveApplicationError`, surfaced as an error toast (#171/#173).
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type ChatThread, NoActiveApplicationError, useStartThreadWithTutor } from '@features/chat';
import { FavoriteButton, useFavorites } from '@features/favorites';
import { ReviewsPreview } from '@features/reviews';
import { Button, EmptyState, ErrorState, LoadingState, Text, useToast } from '@/components/ui';
import { formatPrice, pickDisplayTier, useRefreshControl } from '@/shared';
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
  /** Fires once the chat thread with this tutor is open, so the route can navigate. */
  onContact: (thread: ChatThread) => void;
};

export function TutorDetailScreen({ id, onBack, onContact }: TutorDetailScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const { isFavorite, toggle } = useFavorites();
  const { data: tutor, isLoading, isError, error, isRefetching, refetch } = useTutorDetail(id);
  const { startThread, isStarting } = useStartThreadWithTutor();
  const refreshControl = useRefreshControl(isRefetching, () => void refetch());

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

  const handleContact = async () => {
    try {
      const thread = await startThread(tutor.id);
      onContact(thread);
    } catch (contactError) {
      toast.show({
        message:
          contactError instanceof NoActiveApplicationError
            ? t('tutors.detail.contactNoApplication')
            : t('tutors.detail.contactError'),
        type: 'error',
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {header}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
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
              {tutor.subjects.map((subject) => {
                const tier = pickDisplayTier(subject.pricingTiers);
                return (
                  <InfoTag
                    key={subject.subjectId}
                    icon="book-open"
                    label={subject.name}
                    note={
                      tier
                        ? `${formatPrice(tier.amount, tutor.currency)}${t(`tutors.pricePeriod.${tier.period}`)}`
                        : undefined
                    }
                  />
                );
              })}
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
          onPress={() => void handleContact()}
          loading={isStarting}
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

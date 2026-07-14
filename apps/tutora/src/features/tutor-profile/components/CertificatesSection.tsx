/**
 * CertificatesSection — the tutor's certificates block on the Profile tab
 * (tutor epic #51, #54).
 *
 * Lists every certificate with its moderation status and a remove action, and opens
 * a sheet to add a new one (pick a file → upload → register). Mirrors the
 * composition of `ProfileCollectionsSection`: the section owns the mutation hook and
 * toasts a failed delete so a dropped edit is never silent.
 */
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Text, useToast } from '@/components/ui';
import { spacing } from '@/theme';

import { useCertificates } from '../hooks/useCertificates';
import type { MyTutorProfile } from '../types';
import { AddCertificateSheet } from './AddCertificateSheet';
import { CertificateRow } from './CertificateRow';

export type CertificatesSectionProps = {
  profile: MyTutorProfile;
};

export function CertificatesSection({ profile }: CertificatesSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { createCertificate, deleteCertificate, isCreating, deletingId } = useCertificates();

  const handleRemove = async (certificateId: string) => {
    try {
      await deleteCertificate(certificateId);
    } catch {
      toast.show({ message: t('tutor.profile.certificates.removeError'), type: 'error' });
    }
  };

  return (
    <Card padding="lg" style={styles.card}>
      <Text variant="subtitle">{t('tutor.profile.certificates.title')}</Text>

      {profile.certificates.length === 0 ? (
        <Text variant="bodySmall" color="textSecondary">
          {t('tutor.profile.certificates.empty')}
        </Text>
      ) : (
        profile.certificates.map((certificate) => (
          <CertificateRow
            key={certificate.id}
            certificate={certificate}
            isDeleting={deletingId === certificate.id}
            onRemove={() => void handleRemove(certificate.id)}
          />
        ))
      )}

      <Button
        label={t('tutor.profile.certificates.add')}
        variant="outline"
        size="compact"
        leadingIcon="upload"
        onPress={() => setSheetOpen(true)}
        style={styles.addButton}
      />

      <AddCertificateSheet
        visible={isSheetOpen}
        isSubmitting={isCreating}
        onClose={() => setSheetOpen(false)}
        onSubmit={createCertificate}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
});

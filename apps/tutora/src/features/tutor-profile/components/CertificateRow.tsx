/**
 * CertificateRow — one of the tutor's own certificates, with its status and a
 * remove affordance (tutor epic #51, #54).
 *
 * Unlike the public `CertificateItem` (verified-only, read-only), the owner sees
 * every state — including PENDING and REJECTED — plus a delete button. While its
 * own delete is in flight the row shows a spinner in place of the button, so a
 * double-tap can't fire twice.
 */
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/ui';
import { spacing, useColors } from '@/theme';

import type { TutorCertificate } from '../types';
import { CertificateStatusBadge } from './CertificateStatusBadge';

export type CertificateRowProps = {
  certificate: TutorCertificate;
  isDeleting: boolean;
  onRemove: () => void;
};

export function CertificateRow({ certificate, isDeleting, onRemove }: CertificateRowProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View style={styles.row}>
      <Icon name="award" size={20} color="primary" />
      <View style={styles.text}>
        <Text variant="label" numberOfLines={2}>
          {certificate.title}
        </Text>
        {certificate.issuedBy ? (
          <Text variant="caption" color="muted">
            {certificate.issuedBy}
          </Text>
        ) : null}
        <CertificateStatusBadge status={certificate.status} />
      </View>
      {isDeleting ? (
        <ActivityIndicator color={colors.muted} />
      ) : (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t('tutor.profile.certificates.remove', {
            certificate: certificate.title,
          })}
          hitSlop={8}
        >
          <Icon name="trash" size={18} color="danger" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
});

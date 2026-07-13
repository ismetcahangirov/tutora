/**
 * CertificateItem — one verified certificate row (student epic #40, #44).
 *
 * Only verified certificates reach the client, so the row is a trust signal: an
 * award icon, the title, and the issuing body when known. Non-interactive (the
 * file itself is not opened here).
 */
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { TutorCertificate } from '../types';

export type CertificateItemProps = {
  certificate: TutorCertificate;
};

export function CertificateItem({ certificate }: CertificateItemProps) {
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
      </View>
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
    gap: 2,
  },
});

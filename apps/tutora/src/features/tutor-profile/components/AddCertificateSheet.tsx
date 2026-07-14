/**
 * AddCertificateSheet — the form to add a certificate: title, optional issuer, and
 * the picked file (tutor epic #51, #54).
 *
 * Keeps its own draft state and resets on close, so reopening starts clean. The
 * file is picked and validated here — before any network call — while the actual
 * upload + register runs on submit via the parent's `onSubmit`. The submit button
 * stays disabled until there is a title and a valid file.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, Icon, Input, Text, useToast } from '@/components/ui';
import { radius, spacing, useColors } from '@/theme';

import { CERTIFICATE_ISSUED_BY_MAX_LENGTH, CERTIFICATE_TITLE_MAX_LENGTH } from '../constants';
import type { CreateCertificateArgs } from '../hooks/useCertificates';
import { pickCertificateFile, validateCertificateFile } from '../services/certificate-files';
import type { PickedCertificate } from '../types';

export type AddCertificateSheetProps = {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (args: CreateCertificateArgs) => Promise<unknown>;
};

export function AddCertificateSheet({
  visible,
  isSubmitting,
  onClose,
  onSubmit,
}: AddCertificateSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [file, setFile] = useState<PickedCertificate | null>(null);

  const reset = () => {
    setTitle('');
    setIssuedBy('');
    setFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePick = async () => {
    const picked = await pickCertificateFile();
    if (!picked) {
      return;
    }
    const error = validateCertificateFile(picked);
    if (error) {
      toast.show({ message: t(`tutor.profile.certificates.file.${error}`), type: 'error' });
      return;
    }
    setFile(picked);
  };

  const handleSubmit = async () => {
    if (!file || title.trim().length === 0) {
      return;
    }
    try {
      await onSubmit({ title: title.trim(), issuedBy: issuedBy.trim() || undefined, file });
      toast.show({ message: t('tutor.profile.certificates.added'), type: 'success' });
      handleClose();
    } catch {
      toast.show({ message: t('tutor.profile.certificates.uploadError'), type: 'error' });
    }
  };

  const canSubmit = title.trim().length > 0 && file !== null;

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={t('tutor.profile.certificates.pickerTitle')}
    >
      <Input
        label={t('tutor.profile.certificates.titleLabel')}
        placeholder={t('tutor.profile.certificates.titlePlaceholder')}
        value={title}
        onChangeText={setTitle}
        maxLength={CERTIFICATE_TITLE_MAX_LENGTH}
        disabled={isSubmitting}
      />
      <Input
        label={t('tutor.profile.certificates.issuedByLabel')}
        placeholder={t('tutor.profile.certificates.issuedByPlaceholder')}
        value={issuedBy}
        onChangeText={setIssuedBy}
        maxLength={CERTIFICATE_ISSUED_BY_MAX_LENGTH}
        disabled={isSubmitting}
      />

      {file ? (
        <View style={[styles.fileRow, { borderColor: colors.border }]}>
          <Icon name="award" size={18} color="primary" />
          <Text variant="bodySmall" numberOfLines={1} style={styles.fileName}>
            {file.name}
          </Text>
        </View>
      ) : null}

      <Button
        label={
          file
            ? t('tutor.profile.certificates.changeFile')
            : t('tutor.profile.certificates.selectFile')
        }
        variant="outline"
        leadingIcon="upload"
        onPress={() => void handlePick()}
        disabled={isSubmitting}
        fullWidth
      />
      <Button
        label={t('tutor.profile.certificates.add')}
        onPress={() => void handleSubmit()}
        loading={isSubmitting}
        disabled={!canSubmit}
        fullWidth
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fileName: {
    flex: 1,
  },
});

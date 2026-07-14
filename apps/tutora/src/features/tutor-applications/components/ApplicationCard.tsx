/**
 * ApplicationCard — one incoming application with its actions (tutor epic #51, #57).
 *
 * Shows who applied (student), what for (subject · format · date), their optional
 * message, and the current status. The available actions follow the lifecycle: a
 * pending application can be accepted or declined; an accepted one can be marked
 * complete; closed states show none. The card being acted on shows a spinner and
 * disables its buttons via `isPending`.
 */
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Card, Text } from '@/components/ui';
import { formatShortDate } from '@/shared';
import { spacing, useColors } from '@/theme';

import type { ApplicationAction, TutorApplication } from '../types';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';

export type ApplicationCardProps = {
  application: TutorApplication;
  isPending: boolean;
  onRespond: (action: ApplicationAction, id: string) => void;
};

export function ApplicationCard({ application, isPending, onRespond }: ApplicationCardProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const metaParts = [
    application.subject?.name,
    application.format
      ? t(`tutors.format.${application.format}`, { defaultValue: application.format })
      : null,
    formatShortDate(application.createdAt),
  ].filter(Boolean);

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={application.student.avatarUrl} name={application.student.name} size={44} />
        <View style={styles.headerText}>
          <Text variant="subtitle" numberOfLines={1}>
            {application.student.name ?? t('tutor.applications.anonymousStudent')}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {metaParts.join(' · ')}
          </Text>
        </View>
        <ApplicationStatusBadge status={application.status} />
      </View>

      {application.message ? (
        <Text
          variant="body"
          color="textSecondary"
          style={[styles.message, { borderLeftColor: colors.border }]}
        >
          {application.message}
        </Text>
      ) : null}

      {application.status === 'PENDING' ? (
        <View style={styles.actions}>
          <Button
            label={t('tutor.applications.actions.decline')}
            variant="outline"
            size="compact"
            onPress={() => onRespond('decline', application.id)}
            disabled={isPending}
            style={styles.action}
          />
          <Button
            label={t('tutor.applications.actions.accept')}
            size="compact"
            onPress={() => onRespond('accept', application.id)}
            loading={isPending}
            style={styles.action}
          />
        </View>
      ) : null}

      {application.status === 'ACCEPTED' ? (
        <Button
          label={t('tutor.applications.actions.complete')}
          size="compact"
          leadingIcon="check"
          onPress={() => onRespond('complete', application.id)}
          loading={isPending}
          fullWidth
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  message: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
});

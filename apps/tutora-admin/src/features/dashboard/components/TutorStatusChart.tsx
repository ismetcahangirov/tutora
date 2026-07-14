import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui';

import type { TutorStatusCount, VerificationStatus } from '../types';

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  color: 'var(--color-popover-foreground)',
} as const;

const AXIS_TICK = { fill: 'var(--color-muted-foreground)', fontSize: 12 } as const;

/** One token colour per verification state. */
const STATUS_COLOR: Record<VerificationStatus, string> = {
  UNVERIFIED: 'var(--color-muted-foreground)',
  PENDING: 'var(--color-warning)',
  VERIFIED: 'var(--color-success)',
  REJECTED: 'var(--color-destructive)',
};

/** Tutor headcount per verification state (issue #61). */
export function TutorStatusChart({ data }: { data: TutorStatusCount[] }) {
  const { t } = useTranslation();

  // Reuse the verification enum labels (same states, one source of truth).
  const rows = useMemo(
    () => data.map((row) => ({ ...row, label: t(`verifications.status.${row.status}`) })),
    [data, t],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.charts.tutorStatus.title')}</CardTitle>
        <CardDescription>{t('dashboard.charts.tutorStatus.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--color-muted)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {rows.map((row) => (
                  <Cell key={row.status} fill={STATUS_COLOR[row.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

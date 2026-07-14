import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui';

import type { SignupsPoint } from '../types';

/** Tooltip surface on design tokens (dark-mode aware; no gradients). */
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  color: 'var(--color-popover-foreground)',
} as const;

const AXIS_TICK = { fill: 'var(--color-muted-foreground)', fontSize: 12 } as const;

/** New students vs. tutors per day over the trailing window (issue #61). */
export function SignupsChart({ data }: { data: SignupsPoint[] }) {
  const { t, i18n } = useTranslation();
  const formatDay = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
      new Date(value),
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.charts.signups.title')}</CardTitle>
        <CardDescription>{t('dashboard.charts.signups.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(value) => formatDay(String(value))}
                cursor={{ stroke: 'var(--color-border)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="students"
                name={t('dashboard.charts.signups.students')}
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="tutors"
                name={t('dashboard.charts.signups.tutors')}
                stroke="var(--color-success)"
                fill="var(--color-success)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

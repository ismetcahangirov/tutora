import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable, ErrorView } from '@shared/components';
import { Badge, Button, Card, Skeleton } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { formatMoney } from '@shared/utils/formatMoney';

import { usePlansQuery } from '../hooks/usePlans';
import { PLAN_TIERS, type Plan, type PlanTier } from '../types';
import { PlanFormDialog } from './PlanFormDialog';
import { PlanTierBadge } from './PlanTierBadge';

/** Compact summary of a plan's entitlements: the two limits plus enabled flags. */
function EntitlementsCell({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  const { entitlements: e } = plan;
  const flags = [
    e.featuredProfile && t('payments.entitlements.featuredProfile'),
    e.analytics && t('payments.entitlements.analytics'),
    e.prioritySupport && t('payments.entitlements.prioritySupport'),
  ].filter((label): label is string => Boolean(label));

  return (
    <div className="space-y-1.5">
      <p className="text-sm text-foreground">
        {t('payments.entitlements.limits', {
          applications: e.maxActiveApplications,
          favorites: e.maxFavorites,
        })}
      </p>
      {flags.length ? (
        <div className="flex flex-wrap gap-1">
          {flags.map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

/** Plans catalogue (#68): list plans, create for an unused tier, edit any plan. */
export function PlansPanel() {
  const { t, i18n } = useTranslation();
  const { data: plans, isLoading, isError, refetch } = usePlansQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const availableTiers = useMemo<PlanTier[]>(() => {
    const used = new Set((plans ?? []).map((plan) => plan.tier));
    return PLAN_TIERS.filter((tier) => !used.has(tier));
  }, [plans]);

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        id: 'name',
        header: t('payments.plansColumns.name'),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: 'tier',
        header: t('payments.plansColumns.tier'),
        cell: ({ row }) => <PlanTierBadge tier={row.original.tier} />,
      },
      {
        id: 'price',
        header: t('payments.plansColumns.price'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-foreground">
            {formatMoney(row.original.priceMonthly, row.original.currency, i18n.language)}
            <span className="text-muted-foreground"> {t('payments.perMonth')}</span>
          </span>
        ),
      },
      {
        id: 'entitlements',
        header: t('payments.plansColumns.entitlements'),
        cell: ({ row }) => <EntitlementsCell plan={row.original} />,
      },
      {
        id: 'status',
        header: t('payments.plansColumns.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'neutral'}>
            {t(row.original.isActive ? 'payments.planForm.active' : 'payments.planForm.retired')}
          </Badge>
        ),
      },
      {
        id: 'updated',
        header: t('payments.plansColumns.updated'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('payments.plansColumns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => setEditPlan(row.original)}>
              {t('common.edit')}
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n.language],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          disabled={availableTiers.length === 0}
          title={availableTiers.length === 0 ? t('payments.planForm.allTiersUsed') : undefined}
        >
          <Plus />
          {t('payments.planForm.add')}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorView onRetry={() => void refetch()} />
        ) : isLoading ? (
          <TableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={plans ?? []}
            getRowId={(plan) => plan.id}
            emptyLabel={t('payments.plansEmpty')}
          />
        )}
      </Card>

      {createOpen ? (
        <PlanFormDialog plan={null} availableTiers={availableTiers} onOpenChange={setCreateOpen} />
      ) : null}

      {editPlan ? (
        <PlanFormDialog
          key={editPlan.id}
          plan={editPlan}
          availableTiers={availableTiers}
          onOpenChange={(open) => !open && setEditPlan(null)}
        />
      ) : null}
    </div>
  );
}

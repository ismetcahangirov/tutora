import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
} from '@shared/ui';

import { TIER_ENTITLEMENT_DEFAULTS } from '../constants';
import { useCreatePlan, useUpdatePlan } from '../hooks/usePlanMutations';
import {
  currencySchema,
  entitlementLimitSchema,
  planNameSchema,
  priceSchema,
  type CreatePlanBody,
  type Plan,
  type PlanTier,
  type UpdatePlanBody,
} from '../types';
import { PlanTierBadge } from './PlanTierBadge';

type FieldError = 'name' | 'price' | 'currency' | 'maxActiveApplications' | 'maxFavorites' | null;

/** Form-local entitlement shape: numeric limits are edited as text. */
type EntitlementFields = {
  maxActiveApplications: string;
  maxFavorites: string;
  featuredProfile: boolean;
  analytics: boolean;
  prioritySupport: boolean;
};

function seedEntitlements(plan: Plan | null, tier: PlanTier): EntitlementFields {
  const source = plan?.entitlements ?? TIER_ENTITLEMENT_DEFAULTS[tier];
  return {
    maxActiveApplications: String(source.maxActiveApplications),
    maxFavorites: String(source.maxFavorites),
    featuredProfile: source.featuredProfile,
    analytics: source.analytics,
    prioritySupport: source.prioritySupport,
  };
}

/** A boolean field rendered as a two-option select (no checkbox in the UI kit). */
function BooleanSelect({
  id,
  label,
  value,
  onChange,
  trueLabel,
  falseLabel,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
      >
        <option value="true">{trueLabel}</option>
        <option value="false">{falseLabel}</option>
      </Select>
    </div>
  );
}

/**
 * Create or edit a subscription plan (issue #68). State is seeded from `plan`
 * and the dialog is remounted per plan (via `key`), so no effect syncs props.
 * `tier` is a plan's immutable identity: it is chosen on create (only for tiers
 * without a plan yet) and shown read-only on edit. Entitlement overrides are
 * sent explicitly; the backend resolves and validates them.
 */
export function PlanFormDialog({
  plan,
  availableTiers,
  onOpenChange,
}: {
  /** The plan being edited, or `null` to create a new one. */
  plan: Plan | null;
  /** Tiers that have no plan yet — the only choices when creating. */
  availableTiers: readonly PlanTier[];
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const mutation = plan ? update : create;

  const initialTier = plan?.tier ?? availableTiers[0] ?? 'FREE';

  const [tier, setTier] = useState<PlanTier>(initialTier);
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(plan ? String(plan.priceMonthly) : '');
  const [currency, setCurrency] = useState(plan?.currency ?? 'AZN');
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [ent, setEnt] = useState<EntitlementFields>(() => seedEntitlements(plan, initialTier));
  const [fieldError, setFieldError] = useState<FieldError>(null);

  // On create, switching tier reseeds the entitlement baseline for that tier.
  const handleTierChange = (next: PlanTier) => {
    setTier(next);
    setEnt(seedEntitlements(null, next));
  };

  const setEntField = <K extends keyof EntitlementFields>(key: K, value: EntitlementFields[K]) =>
    setEnt((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const parsedName = planNameSchema.safeParse(name);
    if (!parsedName.success) return setFieldError('name');

    const parsedPrice = priceSchema.safeParse(Number(price));
    if (!parsedPrice.success) return setFieldError('price');

    const parsedCurrency = currencySchema.safeParse(currency);
    if (!parsedCurrency.success) return setFieldError('currency');

    const parsedApplications = entitlementLimitSchema.safeParse(Number(ent.maxActiveApplications));
    if (!parsedApplications.success) return setFieldError('maxActiveApplications');

    const parsedFavorites = entitlementLimitSchema.safeParse(Number(ent.maxFavorites));
    if (!parsedFavorites.success) return setFieldError('maxFavorites');

    setFieldError(null);

    const entitlements = {
      maxActiveApplications: parsedApplications.data,
      maxFavorites: parsedFavorites.data,
      featuredProfile: ent.featuredProfile,
      analytics: ent.analytics,
      prioritySupport: ent.prioritySupport,
    };
    const common = {
      name: parsedName.data,
      priceMonthly: parsedPrice.data,
      currency: parsedCurrency.data,
      entitlements,
      isActive,
    };

    const onSuccess = () => onOpenChange(false);
    if (plan) {
      update.mutate({ id: plan.id, body: common satisfies UpdatePlanBody }, { onSuccess });
    } else {
      create.mutate({ tier, ...common } satisfies CreatePlanBody, { onSuccess });
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>
            {t(plan ? 'payments.planForm.editTitle' : 'payments.planForm.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('payments.planForm.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-tier">{t('payments.planForm.tier')}</Label>
              {plan ? (
                <div className="flex h-9 items-center">
                  <PlanTierBadge tier={plan.tier} />
                </div>
              ) : (
                <Select
                  id="plan-tier"
                  value={tier}
                  onChange={(e) => {
                    const next = availableTiers.find((option) => option === e.target.value);
                    if (next) handleTierChange(next);
                  }}
                >
                  {availableTiers.map((option) => (
                    <option key={option} value={option}>
                      {t(`payments.tier.${option}`)}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-name">{t('payments.planForm.name')}</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
              />
              {fieldError === 'name' ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('payments.planForm.nameRequired')}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-price">{t('payments.planForm.price')}</Label>
                <Input
                  id="plan-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
                {fieldError === 'price' ? (
                  <p role="alert" className="text-sm text-destructive">
                    {t('payments.planForm.priceInvalid')}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-currency">{t('payments.planForm.currency')}</Label>
                <Input
                  id="plan-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  maxLength={3}
                  autoComplete="off"
                  placeholder="AZN"
                  required
                />
                {fieldError === 'currency' ? (
                  <p role="alert" className="text-sm text-destructive">
                    {t('payments.planForm.currencyInvalid')}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">
                {t('payments.planForm.entitlements')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-max-applications">
                    {t('payments.planForm.maxActiveApplications')}
                  </Label>
                  <Input
                    id="plan-max-applications"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step="1"
                    value={ent.maxActiveApplications}
                    onChange={(e) => setEntField('maxActiveApplications', e.target.value)}
                    required
                  />
                  {fieldError === 'maxActiveApplications' ? (
                    <p role="alert" className="text-sm text-destructive">
                      {t('payments.planForm.limitInvalid')}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="plan-max-favorites">{t('payments.planForm.maxFavorites')}</Label>
                  <Input
                    id="plan-max-favorites"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step="1"
                    value={ent.maxFavorites}
                    onChange={(e) => setEntField('maxFavorites', e.target.value)}
                    required
                  />
                  {fieldError === 'maxFavorites' ? (
                    <p role="alert" className="text-sm text-destructive">
                      {t('payments.planForm.limitInvalid')}
                    </p>
                  ) : null}
                </div>

                <BooleanSelect
                  id="plan-featured"
                  label={t('payments.planForm.featuredProfile')}
                  value={ent.featuredProfile}
                  onChange={(value) => setEntField('featuredProfile', value)}
                  trueLabel={t('payments.planForm.enabled')}
                  falseLabel={t('payments.planForm.disabled')}
                />
                <BooleanSelect
                  id="plan-analytics"
                  label={t('payments.planForm.analytics')}
                  value={ent.analytics}
                  onChange={(value) => setEntField('analytics', value)}
                  trueLabel={t('payments.planForm.enabled')}
                  falseLabel={t('payments.planForm.disabled')}
                />
                <BooleanSelect
                  id="plan-priority-support"
                  label={t('payments.planForm.prioritySupport')}
                  value={ent.prioritySupport}
                  onChange={(value) => setEntField('prioritySupport', value)}
                  trueLabel={t('payments.planForm.enabled')}
                  falseLabel={t('payments.planForm.disabled')}
                />
                <BooleanSelect
                  id="plan-active"
                  label={t('payments.planForm.availability')}
                  value={isActive}
                  onChange={setIsActive}
                  trueLabel={t('payments.planForm.active')}
                  falseLabel={t('payments.planForm.retired')}
                />
              </div>
            </div>

            {mutation.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('payments.planForm.error')}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm" disabled={mutation.isPending}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {t(plan ? 'payments.planForm.save' : 'payments.planForm.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

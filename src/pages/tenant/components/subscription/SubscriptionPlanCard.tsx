import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BillingPlan } from '@/lib/api/Api';
import { formatInterval, formatPrice } from '@/pages/tenant/components/subscription/subscriptionFormatters';

interface SubscriptionPlanCardProps {
  plan: BillingPlan;
  isFeatured: boolean;
  isCheckoutLoading: boolean;
  isCurrentPlan: boolean;
  mode: 'subscribe' | 'upgrade';
  onPlanSelect: (stripePriceId: string) => void;
}

export function SubscriptionPlanCard({
  plan,
  isFeatured,
  isCheckoutLoading,
  isCurrentPlan,
  mode,
  onPlanSelect,
}: SubscriptionPlanCardProps) {
  const isUpgradeFlow = mode === 'upgrade';

  return (
    <section
      className={`relative flex h-full flex-col rounded-xl border p-5 shadow-sm transition-shadow ${
        isFeatured
          ? 'border-primary/40 bg-primary/5 shadow-primary/10'
          : 'border-border bg-card'
      }`}
    >
      {isFeatured ? (
        <span className="bg-primary text-primary-foreground absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          Most popular
        </span>
      ) : null}

      <h3 className="text-foreground text-base font-semibold">{plan.name}</h3>
      <p className="text-foreground mt-2 text-3xl font-bold tracking-tight">
        {formatPrice(plan.amount, plan.currency)}
      </p>
      <p className="text-muted-foreground mt-1 text-xs uppercase tracking-wide">
        billed {formatInterval(plan.interval)}
      </p>

      <ul className="mt-4 flex-1 space-y-2 text-sm">
        {plan.featureHighlights.length > 0 ? (
          plan.featureHighlights.map((highlight) => (
            <li key={highlight} className="text-muted-foreground flex items-start gap-2">
              <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{highlight}</span>
            </li>
          ))
        ) : (
          <li className="text-muted-foreground flex items-start gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Core billing and subscription controls</span>
          </li>
        )}
        <li className="text-muted-foreground flex items-start gap-2">
          <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {plan.isTrialEnabled && plan.trialDays > 0
              ? `${plan.trialDays}-day trial included`
              : 'No trial period'}
          </span>
        </li>
      </ul>

      <Button
        className="mt-6 w-full justify-center text-center"
        disabled={isCheckoutLoading || (isUpgradeFlow && isCurrentPlan)}
        onClick={() => onPlanSelect(plan.stripePriceId)}
        size="sm"
        type="button"
        variant={isFeatured ? 'default' : 'outline'}
      >
        {isCheckoutLoading
          ? 'Starting checkout...'
          : isUpgradeFlow && isCurrentPlan
            ? 'Current plan'
            : isUpgradeFlow
              ? `Switch to ${plan.name}`
              : `Choose ${plan.name}`}
      </Button>
    </section>
  );
}
